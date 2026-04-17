import { Injectable } from '@angular/core';
import { Archive as LibArchive } from 'libarchive.js';

const IA_BASE = 'https://archive.org';
const DEV_BACKEND_ORIGIN = 'http://localhost:3001';
const DEV_PROXY_PREFIX = `${DEV_BACKEND_ORIGIN}/archive`;

@Injectable({
  providedIn: 'root',
})
export class Archive {
  // Use OMDb (free up to 1k/day) or TMDB for the "Good" metadata
  private EXTERNAL_METADATA_API = 'https://www.omdbapi.com';
  private libarchiveReady: Promise<void> | null = null;

  private ensureLibarchiveReady(): Promise<void> {
    if (!this.libarchiveReady) {
      this.libarchiveReady = (async () => {
        await LibArchive.init({ workerUrl: '/libarchive/worker-bundle.js' });
      })();
    }
    return this.libarchiveReady;
  }

  /**
   * 1. PEEKS inside a remote archive by fetching it as a blob and listing
   * the entries with libarchive.js.
   */
  async listArchiveContents(
    identifier: string,
    archiveFilename: string,
    progressCb?: (percent: number, message?: string) => void,
  ): Promise<any[]> {
    try {
      if (progressCb) progressCb(10, 'Fetching IA metadata');
      const meta = await this.getMetadata(identifier);
      const files = meta?.files ?? [];
      const base = (archiveFilename || '').replace(/\.[^.]+$/i, '');

      // If the IA item already lists files that look like emulator/media files
      // and are related to the archive filename, return those as lightweight entries
      // so the UI can open them directly without ranged ZIP requests.
      const romLikeExt = new Set([
        'gba', 'gb', 'gbc', 'nes', 'sfc', 'smc', 'bin', 'nds', 'n64', 'z64', 'iso', 'cue', 'pbp', 'rom', 'img'
      ]);

      const candidateFiles = files
        .map((f: any) => ({ name: f.name || f.filename || f.file || '', size: f.size, raw: f }))
        .filter((f: any) => f.name && f.name.toLowerCase() !== archiveFilename.toLowerCase())
        .filter((f: any) => {
          const n = f.name.toLowerCase();
          const ext = n.split('.').pop() || '';
          // ignore other archives
          if (['zip', '7z', 'rar'].includes(ext)) return false;
          // prefer obvious rom/media extensions, or names that contain the zip base
          if (romLikeExt.has(ext)) return true;
          if (base && n.includes(base.toLowerCase())) return true;
          return false;
        });

      if (candidateFiles.length) {
        if (progressCb) progressCb(100, 'Using IA metadata');
        // Return a lightweight array that the UI will normalize and handle.
        return candidateFiles.map((c: any) => ({ filename: c.name, name: c.name, file: null, metadataOnly: true, raw: c.raw } as any));
      }
    } catch (metaErr) {
      if (progressCb) progressCb(20, 'Metadata unavailable, falling back');
      // ignore metadata failures and fall back to peeking
    }

    const url = this.getFileUrl(identifier, archiveFilename);
    return this.listArchiveBlobContentsFromUrl(url, archiveFilename, progressCb);
  }

  async listArchiveBlobContents(blob: Blob, progressCb?: (percent: number, message?: string) => void, fileName = 'archive'): Promise<any[]> {
    await this.ensureLibarchiveReady();
    if (progressCb) progressCb(60, 'Opening archive');
    const archiveFile = blob instanceof File ? blob : new File([blob], fileName);
    const archive = await LibArchive.open(archiveFile);
    return this.extractArchiveEntries(archive, progressCb);
  }

  private async listArchiveBlobContentsFromUrl(url: string, fileName: string, progressCb?: (percent: number, message?: string) => void): Promise<any[]> {
    await this.ensureLibarchiveReady();

    if (progressCb) progressCb(30, 'Downloading archive');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Archive fetch failed: ${response.status}`);
    }

    const blob = await response.blob();
    return this.listArchiveBlobContents(blob, progressCb, fileName);
  }

  private async extractArchiveEntries(archive: any, progressCb?: (percent: number, message?: string) => void): Promise<any[]> {
    try {
      if (progressCb) progressCb(80, 'Listing entries');
      const entries = await archive.getFilesArray();
      const normalized = (entries || [])
        .map((entry: any) => {
          const file = entry?.file ?? null;
          const path = entry?.path ?? '';
          const fileName = file?.name ?? file?.filename ?? '';
          const name = `${path || ''}${fileName || ''}` || fileName || path || '';
          return { name, path, file, entry: file, metadataOnly: false };
        })
        .filter((entry: any) => !!entry.name);
      if (progressCb) progressCb(100, 'Done');
      return normalized;
    } catch (err) {
      console.error('[Archive] archive peek failed.', err);
      if (progressCb) progressCb(0, 'Failed');
      throw err;
    }
  }

  /**
   * 2. EXTRACTS a single file from a remote archive entry.
   */
  async extractFileFromArchive(entry: any): Promise<Blob> {
    if (!entry || typeof entry.extract !== 'function') {
      throw new Error('Cannot extract archive entry');
    }
    return await entry.extract();
  }

  /**
   * 3. ENRICHES "nonsense" filenames with real metadata.
   * Takes "super_mario_bros_1985.zip" -> cleans it -> gets real title/art.
   */
  async getBetterMetadata(filename: string): Promise<any> {
    // Clean: remove extension, replace underscores/dots with spaces
    const cleanName = filename
      .split('.')[0]
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const res = await fetch(`${this.EXTERNAL_METADATA_API}${encodeURIComponent(cleanName)}`);
      return await res.json();
    } catch (err) {
      return { error: 'Could not find better metadata', originalName: cleanName };
    }
  }

  // --- EXISTING UTILS + ARCHIVE SEARCH/LIST ---

  async search(query: string, page = 1, rows = 50, options?: { mediatypes?: string[] }): Promise<any> {
    const params = new URLSearchParams();

    // Build a safer, fielded query so results match title/subject/description
    // instead of global text matches that return loosely-related items.
    const q = (query || '').trim();
    let solrQ = '';
    const looksLikeFielded = /\w+:/.test(q);
    if (!q) {
      solrQ = '*:*';
    } else if (looksLikeFielded) {
      // If the user provided fielded syntax already, trust it.
      solrQ = q;
    } else {
      const esc = (s: string) => s.replace(/"/g, '\\"');
      const term = esc(q);
      const parts = [
        `title:\"${term}\"`,
        `subject:\"${term}\"`,
        `description:\"${term}\"`,
        `creator:\"${term}\"`,
      ];
      solrQ = `(${parts.join(' OR ')})`;
    }

    // Apply mediatype restrictions when provided to narrow results to relevant
    // item types (e.g., software for roms, movies, texts for comics, audio).
    if (options?.mediatypes && options.mediatypes.length > 0 && solrQ !== '*:*') {
      const mts = options.mediatypes.map((m) => m.trim()).filter(Boolean);
      if (mts.length) solrQ = `(${solrQ}) AND mediatype:(${mts.join(' OR ')})`;
    }

    params.set('q', solrQ);
    params.set('output', 'json');
    params.set('page', String(page));
    params.set('rows', String(rows));
    const fields = ['identifier', 'title', 'description', 'mediatype', 'year', 'subject'];
    for (const f of fields) params.append('fl[]', f);

    const url = `${IA_BASE}/advancedsearch.php?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Archive search failed: ${res.status}`);
      return await res.json();
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('Archive search timed out');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async listFiles(identifier: string): Promise<any[]> {
    const meta = await this.getMetadata(identifier);
    return meta?.files ?? [];
  }

  getFileUrl(identifier: string, filename: string): string {
    // When running locally prefer the backend proxy so the browser avoids CORS issues.
    try {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return `${DEV_PROXY_PREFIX}/download/${encodeURIComponent(identifier)}/${encodeURIComponent(filename)}`;
      }
    } catch (e) {
      // fallback to direct archive URL
    }
    return `${IA_BASE}/download/${encodeURIComponent(identifier)}/${encodeURIComponent(filename)}`;
  }

  getModeForFilename(filename: string): string {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    if (this.isEmulatorExt(ext)) return 'emulator';
    if (['mp4', 'webm', 'mkv', 'ogv', 'ogg'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['pdf', 'epub', 'html', 'htm'].includes(ext)) return 'document';
    if (['txt', 'md', 'csv', 'json'].includes(ext)) return 'text';
    return 'other';
  }

  getEmulatorCore(filename: string): string {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    switch (ext) {
      case 'gba':
        return 'mgba';
      case 'gb':
      case 'gbc':
        return 'gambatte';
      case 'nes':
        return 'nestopia';
      case 'smc':
      case 'sfc':
        return 'snes9x';
      case 'nds':
        return 'melonds';
      case 'n64':
      case 'z64':
        return 'mupen64plus_next';
      case 'iso':
      case 'cue':
      case 'bin':
        return 'pcsx_rearmed';
      case 'pbp':
        return 'ppsspp';
      default:
        return 'mgba';
    }
  }

  private isEmulatorExt(ext: string): boolean {
    return [
      'gba', 'gb', 'gbc', 'nes', 'smc', 'sfc', 'bin', 'zip', 'nds', 'n64', 'z64', 'iso', 'cue', 'rom', 'img', 'pbp'
    ].includes(ext);
  }

  async getMetadata(identifier: string): Promise<any> {
    const url = `${IA_BASE}/metadata/${encodeURIComponent(identifier)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Metadata fetch failed: ${res.status}`);
    return res.json();
  }
}

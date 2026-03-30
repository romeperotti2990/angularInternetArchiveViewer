import { Injectable } from '@angular/core';
import * as zip from '@zip.js/zip.js'; // npm install @zip.js/zip.js

const IA_BASE = 'https://archive.org';

@Injectable({
  providedIn: 'root',
})
export class Archive {
  // Use OMDb (free up to 1k/day) or TMDB for the "Good" metadata
  private EXTERNAL_METADATA_API = 'https://www.omdbapi.com';

  /**
   * 1. PEEKS inside a ZIP on IA servers without downloading the whole thing.
   * Uses HTTP Range requests to only grab the ZIP's central directory.
   */
  async listZipContents(identifier: string, zipFilename: string): Promise<zip.Entry[]> {
    const url = this.getFileUrl(identifier, zipFilename);

    // The HttpReader is the magic part—it only requests the bytes it needs
    const reader = new zip.HttpReader(url);
    const zipReader = new zip.ZipReader(reader);

    try {
      const entries = await zipReader.getEntries();
      // We don't close the reader yet if we want to extract later, 
      // but for just listing, we can.
      await zipReader.close();
      return entries;
    } catch (err) {
      console.error('[Archive] ZIP peek failed. Likely CORS or not a valid ZIP.', err);
      throw err;
    }
  }

  /**
   * 2. EXTRACTS a single file from a remote ZIP.
   * Again, only downloads the specific bytes for that one file.
   */
  async extractFileFromZip(entry: zip.FileEntry | zip.Entry): Promise<Blob> {
    if ('directory' in entry && entry.directory) {
      throw new Error('Cannot extract a directory entry');
    }
    // “entry” is narrowed to FileEntry in this branch
    return await (entry as zip.FileEntry).getData(new zip.BlobWriter());
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

  async search(query: string, page = 1, rows = 50): Promise<any> {
    const params = new URLSearchParams();
    params.set('q', query);
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
    return `${IA_BASE}/download/${encodeURIComponent(identifier)}/${encodeURIComponent(filename)}`;
  }

  async getMetadata(identifier: string): Promise<any> {
    const url = `${IA_BASE}/metadata/${encodeURIComponent(identifier)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Metadata fetch failed: ${res.status}`);
    return res.json();
  }
}

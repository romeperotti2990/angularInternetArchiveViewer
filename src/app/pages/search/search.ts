import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Archive } from '../../services/archive';
import { Pagination } from '../../components/pagination/pagination';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, Pagination],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search implements OnInit {
  results: any[] = [];
  mediaTypes = ['software', 'movies', 'texts', 'audio'];
  selectedMedia: Record<string, boolean> = {};
  itemFiles: Record<string, any[]> = {};
  zipContents: Record<string, any[]> = {};
  zipLoading: Record<string, boolean> = {};
  zipError: Record<string, string | null> = {};
  zipProgress: Record<string, number> = {};
  fileLoading: Record<string, boolean> = {};
  fileError: Record<string, string | null> = {};
  error: string | null = null;
  // pagination
  page = 1;
  pageSize = 20;
  pageInput = '1';
  totalResults = 0;

  constructor(private route: ActivatedRoute, private router: Router, public archive: Archive, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((map) => {
      const q = map.get('q') ?? '';
      const mediaParam = map.get('media') ?? '';
      // initialize selected media from query param
      this.selectedMedia = {};
      if (mediaParam) {
        for (const m of mediaParam.split(',').map((s) => s.trim()).filter(Boolean)) {
          this.selectedMedia[m] = true;
        }
      }

      // read pagination params if present so filters and pages stay in sync
      const pageParam = parseInt(map.get('page') ?? '1', 10);
      this.page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
      this.pageInput = String(this.page);

      const pageSizeParam = parseInt(map.get('pageSize') ?? map.get('rows') ?? String(this.pageSize), 10);
      this.pageSize = Number.isFinite(pageSizeParam) && pageSizeParam >= 1 ? pageSizeParam : this.pageSize;

      const mediatypes = Object.keys(this.selectedMedia).filter((k) => this.selectedMedia[k]);

      if (!q) {
        this.results = [];
        this.totalResults = 0;
        return;
      }

      this.runSearch(q, mediatypes.length ? mediatypes : undefined);
    });
  }

  async runSearch(q: string, mediatypes?: string[]) {

    this.error = null;
    console.log('[Search page] running search for:', q, 'page=', this.page, 'pageSize=', this.pageSize);
    try {
      // If the user typed a fielded IA query (e.g. "mediatype:movies") trust it;
      // otherwise restrict to likely useful mediatypes so results aren't noise.
      const looksLikeFielded = /\w+:/.test(q || '');
      const defaultMediatypes = ['software', 'movies', 'texts', 'audio'];
      const effectiveMediatypes = mediatypes ?? defaultMediatypes;
      const res = looksLikeFielded
        ? await this.archive.search(q, this.page, this.pageSize, mediatypes ? { mediatypes } : undefined)
        : await this.archive.search(q, this.page, this.pageSize, { mediatypes: effectiveMediatypes });
      console.log('[Search page] archive.search returned:', res);
      this.totalResults = res?.response?.numFound ?? 0;
      this.results = res?.response?.docs ?? [];
      // detect changes explicitly for zone-less or OnPush environments
      try { this.cdr.detectChanges(); } catch (e) {}
      console.log('[Search page] results assigned:', this.results);
    } catch (err: any) {
      this.error = err?.message ?? String(err);
      this.results = [];
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  toggleMedia(m: string) {
    this.selectedMedia[m] = !this.selectedMedia[m];
    // re-run search with updated filters if we already have a query
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    if (q) {
      const mediatypes = Object.keys(this.selectedMedia).filter((k) => this.selectedMedia[k]);
      this.page = 1;
      this.pageInput = '1';
      // update URL to reflect selected media and reset page
      const qp: any = { q, page: '1', pageSize: String(this.pageSize) };
      if (mediatypes.length) qp.media = mediatypes.join(',');
      this.router.navigate([], { queryParams: qp, replaceUrl: true });
      this.runSearch(q, mediatypes.length ? mediatypes : undefined);
    }
  }

  async loadItemFiles(identifier: string): Promise<void> {
    if (this.itemFiles[identifier] || this.fileLoading[identifier]) return;

    this.fileLoading[identifier] = true;
    this.fileError[identifier] = null;

    try {
      const files = await this.archive.listFiles(identifier);
      this.itemFiles[identifier] = files;
      if (!files.length) {
        this.fileError[identifier] = 'No files found';
      }
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (err: any) {
      this.fileError[identifier] = err?.message ?? String(err);
      this.itemFiles[identifier] = [];
      try { this.cdr.detectChanges(); } catch (e) {}
    } finally {
      this.fileLoading[identifier] = false;
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  // Peek inside a remote ZIP file without downloading the whole archive
  async peekZip(identifier: string, zipFilename: string) {
    const key = `${identifier}::${zipFilename}`;
    if (this.zipContents[key] || this.zipLoading[key]) return;

    this.zipLoading[key] = true;
    this.zipError[key] = null;
    this.zipProgress[key] = 0;

    try {
      const entries = await this.archive.listZipContents(identifier, zipFilename as string, (p: number) => {
        this.zipProgress[key] = Math.max(0, Math.min(100, Math.floor(p))); // integer 0-100
        try { this.cdr.detectChanges(); } catch (e) {}
      });
      // normalize filename prop across entry shapes
      const normalized = (entries || []).map((e: any) => ({
        name: e.filename ?? e.fileName ?? e.name ?? e.entryName ?? '',
        entry: e,
      }));
      this.zipContents[key] = normalized;
      if (!normalized.length) this.zipError[key] = 'No entries found in ZIP';
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (err: any) {
      this.zipError[key] = err?.message ?? String(err);
      this.zipContents[key] = [];
      try { this.cdr.detectChanges(); } catch (e) {}
    } finally {
      this.zipLoading[key] = false;
      this.zipProgress[key] = 100;
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  // Extract a single file entry from a remote ZIP and open in emulator via blob URL
  async playZipEntry(identifier: string, zipFilename: string, entryObj: any, collectionTitle?: string, collectionDescription?: string) {
    try {
      // If this entry came from IA metadata (not an in-zip entry), open the
      // file directly via its archive URL instead of trying to extract.
      if (!entryObj.entry || entryObj.entry.metadataOnly) {
        const url = this.getFileUrl(identifier, entryObj.name);
        const core = this.getEmulatorCore(entryObj.name);
        const qp: any = { mode: 'emulator', core, gameUrl: url };
        if (collectionTitle) qp.collectionTitle = collectionTitle;
        if (collectionDescription) qp.collectionDescription = collectionDescription;
        this.router.navigate(['/media'], { queryParams: qp });
        return;
      }

      const blob = await this.archive.extractFileFromZip(entryObj.entry);
      const url = URL.createObjectURL(blob);
      const core = this.getEmulatorCore(entryObj.name);
      const qp: any = { mode: 'emulator', core, gameUrl: url };
      if (collectionTitle) qp.collectionTitle = collectionTitle;
      if (collectionDescription) qp.collectionDescription = collectionDescription;
      this.router.navigate(['/media'], { queryParams: qp });
      // note: object URL will remain until page unload; could revoke later if desired
    } catch (err: any) {
      const key = `${identifier}::${zipFilename}`;
      this.zipError[key] = err?.message ?? String(err);
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  // Open a non-emulator file entry (video/audio/image/other) from a ZIP in the media page
  async openZipEntry(identifier: string, zipFilename: string, entryObj: any, collectionTitle?: string, collectionDescription?: string) {
    try {
      if (!entryObj.entry || entryObj.entry.metadataOnly) {
        const url = this.getFileUrl(identifier, entryObj.name);
        const mode = this.getModeForFilename(entryObj.name);
        const baseQp: any = {};
        if (collectionTitle) baseQp.collectionTitle = collectionTitle;
        if (collectionDescription) baseQp.collectionDescription = collectionDescription;
        if (mode === 'emulator') {
          const core = this.getEmulatorCore(entryObj.name);
          this.router.navigate(['/media'], { queryParams: { ...baseQp, mode: 'emulator', core, gameUrl: url } });
        } else {
          this.router.navigate(['/media'], { queryParams: { ...baseQp, mode, mediaUrl: url } });
        }
        return;
      }

      const blob = await this.archive.extractFileFromZip(entryObj.entry);
      const url = URL.createObjectURL(blob);
      const mode = this.getModeForFilename(entryObj.name);
      const baseQp: any = {};
      if (collectionTitle) baseQp.collectionTitle = collectionTitle;
      if (collectionDescription) baseQp.collectionDescription = collectionDescription;
      if (mode === 'emulator') {
        const core = this.getEmulatorCore(entryObj.name);
        this.router.navigate(['/media'], { queryParams: { ...baseQp, mode: 'emulator', core, gameUrl: url } });
      } else {
        // route all other viewable types to the in-app media page
        this.router.navigate(['/media'], { queryParams: { ...baseQp, mode, mediaUrl: url } });
      }
    } catch (err: any) {
      const key = `${identifier}::${zipFilename}`;
      this.zipError[key] = err?.message ?? String(err);
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  getModeForFilename(filename: string): string {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    if (this.isEmulatorFile(filename)) return 'emulator';
    if (['mp4', 'webm', 'mkv', 'ogv', 'ogg'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    // documents and plain text
    if (['pdf', 'epub', 'html', 'htm'].includes(ext)) return 'document';
    if (['txt', 'md', 'csv', 'json'].includes(ext)) return 'text';
    return 'other';
  }

  formatBytes(bytes: number | null | undefined): string {
    if (bytes == null || isNaN(Number(bytes))) return '';
    const b = Number(bytes);
    if (b < 1024) return b + ' B';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = b / 1024;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
      value = value / 1024;
      i++;
    }
    return `${value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0)} ${units[i]}`;
  }

  getFileUrl(identifier: string, filename: string): string {
    return this.archive.getFileUrl(identifier, filename);
  }

  openFile(identifier: string, filename: string, collectionTitle?: string, collectionDescription?: string) {
    const mode = this.getModeForFilename(filename);
    const url = this.getFileUrl(identifier, filename);
    if (mode === 'emulator') {
      this.openInEmulator(identifier, filename, collectionTitle, collectionDescription);
    } else {
      const qp: any = { mode, mediaUrl: url };
      if (collectionTitle) qp.collectionTitle = collectionTitle;
      if (collectionDescription) qp.collectionDescription = collectionDescription;
      this.router.navigate(['/media'], { queryParams: qp });
    }
  }

  isEmulatorFile(filename: string): boolean {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    // common emulator-supported extensions (including archives)
    return [
      'gba', 'gb', 'gbc', 'nes', 'smc', 'sfc', 'bin', 'zip', 'nds', 'n64', 'z64', 'iso', 'cue', 'rom', 'img', 'pbp', 'cue'
    ].includes(ext);
  }

  getEmulatorCore(filename: string): string {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    // Map common extensions to emulator core names shipped in emulator cores list.
    // Prefer cores known to work with the given extension.
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
      case 'rom':
      case 'img':
      default:
        // fallback to mgba for many 8/16/32-bit roms or 'fceumm' for NES-like
        return 'mgba';
    }
  }

  openInEmulator(identifier: string, filename: string, collectionTitle?: string, collectionDescription?: string) {
    const core = this.getEmulatorCore(filename);
    const gameUrl = this.getFileUrl(identifier, filename);
    const qp: any = {
      mode: 'emulator',
      core,
      gameUrl,
    };
    if (collectionTitle) qp.collectionTitle = collectionTitle;
    if (collectionDescription) qp.collectionDescription = collectionDescription;
    this.router.navigate(['/media'], { queryParams: qp });
  }

  onPageChange(n: number) {
    this.page = n;
    this.pageInput = String(n);
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    const mediatypes = Object.keys(this.selectedMedia).filter((k) => this.selectedMedia[k]);
    // update URL to include active filters and page
    const qp: any = {};
    if (q) qp.q = q;
    if (mediatypes.length) qp.media = mediatypes.join(',');
    qp.page = String(this.page);
    qp.pageSize = String(this.pageSize);
    this.router.navigate([], { queryParams: qp, replaceUrl: true });
    if (q) this.runSearch(q, mediatypes.length ? mediatypes : undefined);
  }

  onPageSizeChange(n: number) {
    this.pageSize = n;
    this.page = 1;
    this.pageInput = '1';
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    const mediatypes = Object.keys(this.selectedMedia).filter((k) => this.selectedMedia[k]);
    const qp: any = {};
    if (q) qp.q = q;
    if (mediatypes.length) qp.media = mediatypes.join(',');
    qp.page = '1';
    qp.pageSize = String(this.pageSize);
    this.router.navigate([], { queryParams: qp, replaceUrl: true });
    if (q) this.runSearch(q, mediatypes.length ? mediatypes : undefined);
  }
}

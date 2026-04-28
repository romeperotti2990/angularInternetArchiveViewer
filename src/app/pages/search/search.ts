import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Archive } from '../../services/archive';
import { FavoritesService } from '../../services/favorites.service';
import { Pagination } from '../../components/pagination/pagination';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, Pagination],
  templateUrl: './search.html',
})
export class Search implements OnInit, OnDestroy {
  results: any[] = [];
  mediaTypes = ['software', 'movies', 'texts', 'audio'];
  selectedMedia: Record<string, boolean> = {};
  private cachedQueryKey: string | null = null;
  private cachedResults: any[] = [];
  private cachedTotalResults = 0;
  private searchRunId = 0;
  loadingSearch = false;
  loadedResults = 0;
  itemFiles: Record<string, any[]> = {};
  archiveContents: Record<string, any[]> = {};
  archiveLoading: Record<string, boolean> = {};
  archiveError: Record<string, string | null> = {};
  archiveProgress: Record<string, number> = {};
  fileLoading: Record<string, boolean> = {};
  fileError: Record<string, string | null> = {};
  error: string | null = null;
  // pagination
  page = 1;
  pageSize = 20;
  pageInput = '1';
  totalResults = 0;
  expandedDescriptions: Record<string, boolean> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public archive: Archive,
    private cdr: ChangeDetectorRef,
    public favorites: FavoritesService,
  ) {}

  ngOnDestroy(): void {
    this.searchRunId += 1;
    this.results = [];
    this.cachedQueryKey = null;
    this.cachedResults = [];
    this.cachedTotalResults = 0;
    this.loadedResults = 0;
    this.loadingSearch = false;
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((map) => {
      const q = map.get('q') ?? '';
      const mediaParam = map.get('media') ?? '';

      this.selectedMedia = {};
      if (mediaParam) {
        for (const m of mediaParam.split(',').map((s) => s.trim()).filter(Boolean)) {
          this.selectedMedia[m] = true;
        }
      }

      const pageParam = parseInt(map.get('page') ?? '1', 10);
      this.page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
      this.pageInput = String(this.page);

      const pageSizeParam = parseInt(map.get('pageSize') ?? map.get('rows') ?? String(this.pageSize), 10);
      this.pageSize = Number.isFinite(pageSizeParam) && pageSizeParam >= 1 ? pageSizeParam : this.pageSize;

      const mediatypes = Object.keys(this.selectedMedia).filter((key) => this.selectedMedia[key]);
      const queryKey = this.getQueryKey(q, mediatypes);

      if (!q) {
        this.searchRunId += 1;
        this.error = null;
        this.results = [];
        this.totalResults = 0;
        this.cachedQueryKey = null;
        this.cachedResults = [];
        this.cachedTotalResults = 0;
        this.loadedResults = 0;
        this.loadingSearch = false;
        try { this.cdr.detectChanges(); } catch (e) {}
        return;
      }

      if (this.cachedQueryKey === queryKey) {
        this.syncVisibleResults();
        return;
      }

      void this.loadAllSearchResults(q, mediatypes.length ? mediatypes : undefined);
    });
  }

  private getQueryKey(q: string, mediatypes?: string[]): string {
    const normalizedMedia = (mediatypes ?? []).map((m) => m.trim()).filter(Boolean).sort();
    return `${(q || '').trim()}::${normalizedMedia.join(',')}`;
  }

  async loadAllSearchResults(q: string, mediatypes?: string[]) {
    const runId = ++this.searchRunId;
    const queryKey = this.getQueryKey(q, mediatypes);
    const looksLikeFielded = /\w+:/.test(q || '');
    const defaultMediatypes = ['software', 'movies', 'texts', 'audio'];
    const effectiveMediatypes = mediatypes ?? defaultMediatypes;
    const rowsPerRequest = 100;

    this.error = null;
    this.loadingSearch = true;
    this.loadedResults = 0;
    this.cachedQueryKey = queryKey;
    this.cachedResults = [];
    this.cachedTotalResults = 0;
    this.totalResults = 0;
    this.results = [];
    try { this.cdr.detectChanges(); } catch (e) {}

    try {
      let page = 1;
      let totalResults = 0;

      while (runId === this.searchRunId) {
        const res = looksLikeFielded
          ? await this.archive.search(q, page, rowsPerRequest, mediatypes ? { mediatypes } : undefined)
          : await this.archive.search(q, page, rowsPerRequest, { mediatypes: effectiveMediatypes });

        if (runId !== this.searchRunId) return;

        const docs = res?.response?.docs ?? [];
        totalResults = res?.response?.numFound ?? totalResults;
        this.cachedTotalResults = totalResults;
        this.totalResults = totalResults;
        this.cachedResults.push(...docs);
        this.loadedResults = this.cachedResults.length;
        this.syncVisibleResults();

        if (!docs.length || this.cachedResults.length >= totalResults) {
          break;
        }

        page += 1;
      }
    } catch (err: any) {
      if (runId === this.searchRunId) {
        this.error = err?.message ?? String(err);
        this.results = [];
        this.cachedQueryKey = null;
        this.cachedResults = [];
        this.cachedTotalResults = 0;
        this.loadedResults = 0;
        try { this.cdr.detectChanges(); } catch (e) {}
      }
    } finally {
      if (runId === this.searchRunId) {
        this.loadingSearch = false;
        this.syncVisibleResults();
      }
    }
  }

  private syncVisibleResults(): void {
    if (!this.cachedQueryKey) return;
    this.totalResults = this.cachedTotalResults;
    this.results = this.getCachedPageResults();
    try { this.cdr.detectChanges(); } catch (e) {}
  }

  private getCachedPageResults(): any[] {
    const start = Math.max(0, (this.page - 1) * this.pageSize);
    return this.cachedResults.slice(start, start + this.pageSize);
  }

  toggleMedia(m: string) {
    this.selectedMedia[m] = !this.selectedMedia[m];
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    if (q) {
      const mediatypes = Object.keys(this.selectedMedia).filter((key) => this.selectedMedia[key]);
      this.page = 1;
      this.pageInput = '1';
      const qp: any = { q, page: '1', pageSize: String(this.pageSize) };
      if (mediatypes.length) qp.media = mediatypes.join(',');
      this.router.navigate([], { queryParams: qp, replaceUrl: true });
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

  private isArchiveFilename(filename: string): boolean {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    return ['zip', '7z', 'rar', 'tar', 'gz', 'bz2', 'xz'].includes(ext);
  }

  // Peek inside a remote archive file without downloading the whole item.
  async peekArchive(identifier: string, archiveFilename: string) {
    const key = `${identifier}::${archiveFilename}`;
    if (this.archiveContents[key] || this.archiveLoading[key]) return;

    this.archiveLoading[key] = true;
    this.archiveError[key] = null;
    this.archiveProgress[key] = 0;

    try {
      const entries = await this.archive.listArchiveContents(identifier, archiveFilename as string, (p: number) => {
        this.archiveProgress[key] = Math.max(0, Math.min(100, Math.floor(p))); // integer 0-100
        try { this.cdr.detectChanges(); } catch (e) {}
      });
      this.archiveContents[key] = entries || [];
      if (!this.archiveContents[key].length) this.archiveError[key] = 'No entries found in archive';
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (err: any) {
      this.archiveError[key] = err?.message ?? String(err);
      this.archiveContents[key] = [];
      try { this.cdr.detectChanges(); } catch (e) {}
    } finally {
      this.archiveLoading[key] = false;
      this.archiveProgress[key] = 100;
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  // Extract a single file entry from a remote archive and open in emulator via blob URL
  async playArchiveEntry(identifier: string, archiveFilename: string, entryObj: any, collectionTitle?: string, collectionDescription?: string) {
    try {
      const displayLabel = entryObj?.name || archiveFilename;
      // If this entry came from IA metadata (not an in-zip entry), open the
      // file directly via its archive URL instead of trying to extract.
      if (!entryObj.entry || entryObj.entry.metadataOnly) {
        const url = this.getFileUrl(identifier, entryObj.name);
        const core = this.getEmulatorCore(entryObj.name);
        const qp: any = { mode: 'emulator', core, gameUrl: url, displayLabel };
        if (collectionTitle) qp.collectionTitle = collectionTitle;
        if (collectionDescription) qp.collectionDescription = collectionDescription;
        this.router.navigate(['/media'], { queryParams: qp });
        return;
      }

      const blob = await this.archive.extractFileFromArchive(entryObj.entry);
      const url = URL.createObjectURL(blob);
      const core = this.getEmulatorCore(entryObj.name);
      const qp: any = { mode: 'emulator', core, gameUrl: url, displayLabel };
      if (collectionTitle) qp.collectionTitle = collectionTitle;
      if (collectionDescription) qp.collectionDescription = collectionDescription;
      this.router.navigate(['/media'], { queryParams: qp });
      // note: object URL will remain until page unload; could revoke later if desired
    } catch (err: any) {
      const key = `${identifier}::${archiveFilename}`;
      this.archiveError[key] = err?.message ?? String(err);
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  // Open a non-emulator file entry (video/audio/image/other) from an archive in the media page
  async openArchiveEntry(identifier: string, archiveFilename: string, entryObj: any, collectionTitle?: string, collectionDescription?: string) {
    try {
      const displayLabel = entryObj?.name || archiveFilename;
      if (!entryObj.entry || entryObj.entry.metadataOnly) {
        const url = this.getFileUrl(identifier, entryObj.name);
        const mode = this.getModeForFilename(entryObj.name);
        const baseQp: any = { identifier };
        baseQp.displayLabel = displayLabel;
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

      const blob = await this.archive.extractFileFromArchive(entryObj.entry);
      const url = URL.createObjectURL(blob);
      const mode = this.getModeForFilename(entryObj.name);
      const baseQp: any = { identifier };
      baseQp.displayLabel = displayLabel;
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
      const key = `${identifier}::${archiveFilename}`;
      this.archiveError[key] = err?.message ?? String(err);
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  async peekArchiveEntry(identifier: string, parentArchiveFilename: string, entryObj: any): Promise<void> {
    try {
      if (!entryObj?.file || typeof entryObj.file.extract !== 'function') return;
      const nestedKey = `${identifier}::${parentArchiveFilename}::${entryObj.name}`;
      if (this.archiveContents[nestedKey] || this.archiveLoading[nestedKey]) return;

      this.archiveLoading[nestedKey] = true;
      this.archiveError[nestedKey] = null;
      this.archiveProgress[nestedKey] = 0;
      const blob = await this.archive.extractFileFromArchive(entryObj.file);
      this.archiveContents[nestedKey] = await this.archive.listArchiveBlobContents(blob, (p: number) => {
        this.archiveProgress[nestedKey] = Math.max(0, Math.min(100, Math.floor(p)));
        try { this.cdr.detectChanges(); } catch (e) {}
      });
      if (!this.archiveContents[nestedKey].length) this.archiveError[nestedKey] = 'No entries found in archive';
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (err: any) {
      const nestedKey = `${identifier}::${parentArchiveFilename}::${entryObj?.name ?? 'archive'}`;
      this.archiveError[nestedKey] = err?.message ?? String(err);
      this.archiveContents[nestedKey] = [];
      try { this.cdr.detectChanges(); } catch (e) {}
    } finally {
      const nestedKey = `${identifier}::${parentArchiveFilename}::${entryObj?.name ?? 'archive'}`;
      this.archiveLoading[nestedKey] = false;
      this.archiveProgress[nestedKey] = 100;
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  getModeForFilename(filename: string): string {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    if (['cbz', 'cbr', 'cb7'].includes(ext)) return 'comic';
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
    console.log('[SearchPage] openFile:', { identifier, filename, mode, url });
    if (mode === 'emulator') {
      this.openInEmulator(identifier, filename, collectionTitle, collectionDescription);
    } else {
      const qp: any = { mode, mediaUrl: url, displayLabel: filename, identifier };
      if (collectionTitle) qp.collectionTitle = collectionTitle;
      if (collectionDescription) qp.collectionDescription = collectionDescription;
      this.router.navigate(['/media'], { queryParams: qp });
    }
  }

  isArchiveFile(filename: string): boolean {
    return this.isArchiveFilename(filename);
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
      displayLabel: filename,
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
    this.syncVisibleResults();
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
    this.syncVisibleResults();
  }
}

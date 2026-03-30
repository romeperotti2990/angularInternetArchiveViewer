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

      if (!q) {
        this.results = [];
        return;
      }
      this.page = 1;
      this.pageInput = '1';
      const mediatypes = Object.keys(this.selectedMedia).filter((k) => this.selectedMedia[k]);
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
      this.runSearch(q, mediatypes.length ? mediatypes : undefined);
      // update URL to reflect selected media
      const qp: any = { q };
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

  getFileUrl(identifier: string, filename: string): string {
    return this.archive.getFileUrl(identifier, filename);
  }

  isEmulatorFile(filename: string): boolean {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    return ['gba', 'nes', 'smc', 'sfc', 'bin', 'zip'].includes(ext);
  }

  getEmulatorCore(filename: string): string {
    const ext = (filename || '').toLowerCase().split('.').pop() || '';
    switch (ext) {
      case 'gba':
        return 'gba';
      case 'nes':
        return 'nes';
      case 'smc':
      case 'sfc':
        return 'snes';
      default:
        return 'gba';
    }
  }

  openInEmulator(identifier: string, filename: string) {
    const core = this.getEmulatorCore(filename);
    const gameUrl = this.getFileUrl(identifier, filename);
    this.router.navigate(['/media'], {
      queryParams: {
        mode: 'emulator',
        core,
        gameUrl,
      },
    });
  }

  onPageChange(n: number) {
    this.page = n;
    this.pageInput = String(n);
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    if (q) this.runSearch(q);
  }

  onPageSizeChange(n: number) {
    this.pageSize = n;
    this.page = 1;
    this.pageInput = '1';
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    if (q) this.runSearch(q);
  }
}

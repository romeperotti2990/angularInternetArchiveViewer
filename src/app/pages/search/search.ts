import { Component, OnInit } from '@angular/core';
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
  itemFiles: Record<string, any[]> = {};
  fileLoading: Record<string, boolean> = {};
  fileError: Record<string, string | null> = {};
  error: string | null = null;
  // pagination
  page = 1;
  pageSize = 20;
  pageInput = '1';
  totalResults = 0;

  constructor(private route: ActivatedRoute, private router: Router, public archive: Archive) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((map) => {
      const q = map.get('q') ?? '';
      if (!q) {
        this.results = [];
        return;
      }
      this.page = 1;
      this.pageInput = '1';
      this.runSearch(q);
    });
  }

  async runSearch(q: string) {

    this.error = null;
    console.log('[Search page] running search for:', q, 'page=', this.page, 'pageSize=', this.pageSize);
    try {
      const res = await this.archive.search(q, this.page, this.pageSize);
      console.log('[Search page] archive.search returned:', res);
      this.totalResults = res?.response?.numFound ?? 0;
      this.results = res?.response?.docs ?? [];
      console.log('[Search page] results assigned:', this.results);
    } catch (err: any) {
      this.error = err?.message ?? String(err);
      this.results = [];
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
    } catch (err: any) {
      this.fileError[identifier] = err?.message ?? String(err);
      this.itemFiles[identifier] = [];
    } finally {
      this.fileLoading[identifier] = false;
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

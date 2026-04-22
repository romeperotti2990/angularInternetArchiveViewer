import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Archive } from '../../services/archive';

@Component({
  selector: 'app-comic-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #comicContainer class="comic-container flex flex-col items-center p-4 bg-gray-900 rounded-lg shadow-inner min-h-80 relative" [class.fullscreen]="isFullscreen">
      <!-- Fullscreen Toggle Button -->
      <button (click)="toggleFullscreen()" class="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition shadow-lg border border-white/10">
        <svg *ngIf="!isFullscreen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <svg *ngIf="isFullscreen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div *ngIf="loading" class="flex flex-col items-center justify-center p-10 w-full animate-in fade-in duration-500">
        <div class="w-full max-w-md bg-gray-700 rounded-full h-4 mb-4 overflow-hidden shadow-inner ring-1 ring-white/10">
          <div class="bg-blue-500 h-full transition-all duration-300 shadow-[0_0_15px_#3b82f6]" [style.width.%]="progress"></div>
        </div>
        <p class="text-blue-400 font-bold text-lg tracking-tight">{{ loadingMessage }}</p>
        <p class="text-xs text-gray-400 mt-2 font-mono tracking-widest">{{ progress }}% LOADED</p>
      </div>

      <div *ngIf="error" class="bg-red-900/40 border border-red-500/50 text-red-100 px-6 py-4 rounded-xl relative my-4 shadow-2xl backdrop-blur-md" role="alert">
        <strong class="font-bold text-red-400">Error: </strong>
        <span class="block sm:inline ml-1 text-sm opacity-90">{{ error }}</span>
      </div>

      <div *ngIf="!loading && !error && pages.length > 0" class="w-full max-w-5xl animate-in zoom-in-95 duration-300">
        <!-- Controls -->
        <div class="flex items-center justify-between mb-6 sticky top-0 bg-gray-800/80 backdrop-blur-xl p-3 rounded-2xl shadow-2xl z-10 border border-white/5 mx-2">
          <div class="flex gap-2">
            <button (click)="prevPage()" [disabled]="currentIndex === 0" class="px-5 py-2 bg-blue-600 text-white font-black rounded-xl disabled:bg-gray-700/50 disabled:text-gray-500 hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-900/20">
              PREV
            </button>
            <button (click)="nextPage()" [disabled]="currentIndex === pages.length - 1" class="px-5 py-2 bg-blue-600 text-white font-black rounded-xl disabled:bg-gray-700/50 disabled:text-gray-500 hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-900/20">
              NEXT
            </button>
          </div>
          
          <div class="text-center">
            <div class="text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase opacity-80 mb-0.5">Progress</div>
            <div class="text-2xl font-black text-white leading-none tabular-nums">{{ currentIndex + 1 }}<span class="text-gray-500 text-base font-medium mx-1">/</span><span class="text-gray-400 text-lg">{{ pages.length }}</span></div>
          </div>

          <div class="flex gap-2">
            <button (click)="toggleViewMode()" class="px-4 py-2 text-xs font-black bg-white/5 text-gray-200 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all shadow-inner backdrop-blur-sm">
              {{ viewMode === 'single' ? 'VERTICAL' : 'SINGLE' }}
            </button>
          </div>
        </div>

        <!-- Single Page View -->
        <div *ngIf="viewMode === 'single'" class="flex justify-center bg-black/40 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 mx-2 group relative">
          <img [src]="pages[currentIndex].url" 
               [alt]="'Page ' + (currentIndex + 1)" 
               class="max-w-full h-auto object-contain cursor-pointer select-none transition-all duration-500 group-hover:scale-[1.01]"
               (click)="nextPage()" />
        </div>

        <!-- Continuous Scroll View -->
        <div *ngIf="viewMode === 'vertical'" class="flex flex-col bg-black/20 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 mx-2">
          <div *ngFor="let page of pages; let i = index" class="w-full h-auto relative leading-0 font-[0] overflow-hidden">
             <img [src]="page.url" [alt]="'Page ' + (i + 1)" class="w-full h-auto mx-auto border-none p-0 m-0 block" loading="lazy" />
             <!-- Subtle page number overlay for vertical mode -->
             <div class="absolute bottom-4 right-4 bg-black/30 backdrop-blur-sm text-white/50 text-[10px] px-2 py-1 rounded font-mono pointer-events-none">P.{{ i+1 }}</div>
          </div>
        </div>
        
        <!-- Bottom Controls -->
        <div *ngIf="viewMode === 'single'" class="flex items-center justify-center mt-10 pb-6 gap-8">
           <button (click)="prevPage()" [disabled]="currentIndex === 0" class="text-blue-500 font-black hover:text-blue-400 disabled:text-gray-800 transition-all tracking-widest text-sm uppercase">Previous Page</button>
           <div class="h-1 w-1 bg-gray-800 rounded-full"></div>
           <button (click)="nextPage()" [disabled]="currentIndex === pages.length - 1" class="text-blue-500 font-black hover:text-blue-400 disabled:text-gray-800 transition-all tracking-widest text-sm uppercase">Next Page</button>
        </div>
      </div>

      <div *ngIf="!loading && !error && pages.length === 0" class="p-24 text-center flex flex-col items-center opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-gray-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600 font-black text-xl uppercase tracking-widest">No images found in this archive.</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .comic-container { 
      max-height: 90vh; 
      overflow-y: auto; 
      scrollbar-width: thin; 
      scrollbar-color: #3b82f6 #0f172a; 
      background-color: #0f172a;
      transition: all 0.3s ease-in-out;
    }
    .comic-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      max-height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }
    .comic-container::-webkit-scrollbar { width: 6px; }
    .comic-container::-webkit-scrollbar-track { background: #0f172a; }
    .comic-container::-webkit-scrollbar-thumb { background-color: #3b82f6; border-radius: 10px; }
    img { pointer-events: auto; -webkit-user-drag: none; }
    /* Fix for vertical white spaces */
    .leading-[0] { line-height: 0; }
    .font-[0] { font-size: 0; }
  `]
})
export class ComicViewerComponent implements OnInit, OnDestroy {
  @Input() archiveUrl!: string;
  @Input() identifier!: string;
  @Input() filename!: string;

  pages: { name: string, url: string }[] = [];
  currentIndex = 0;
  loading = true;
  loadingMessage = 'Initializing reader...';
  progress = 0;
  error: string | null = null;
  viewMode: 'single' | 'vertical' = 'single';
  isFullscreen = false;

  constructor(private archiveService: Archive, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    console.log('ComicViewerComponent: Initializing with', this.archiveUrl);
    if (!this.archiveUrl) {
      this.error = 'No archive URL provided.';
      this.loading = false;
      return;
    }

    await this.loadComic();
  }

  ngOnDestroy() {
    this.cleanupBlobs();
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    this.cdr.detectChanges();
  }

  private cleanupBlobs() {
    this.pages.forEach(p => {
      try { URL.revokeObjectURL(p.url); } catch (e) {}
    });
    this.pages = [];
  }

  async loadComic() {
    this.loading = true;
    this.loadingMessage = 'Fetching archive...';
    this.progress = 5;
    console.log('[ComicViewer] Starting load for:', this.archiveUrl);
    this.error = null;
    this.cleanupBlobs();
    this.cdr.detectChanges();

    try {
      const response = await fetch(this.archiveUrl);
      if (!response.ok) throw new Error(`Failed to fetch archive: ${response.statusText}`);
      const blob = await response.blob();
      console.log('[ComicViewer] Archive fetched, size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      
      this.loadingMessage = 'Opening comic...';
      this.progress = 20;
      this.cdr.detectChanges();

      const entries = await this.archiveService.listArchiveBlobContents(blob, (p, msg) => {
        this.progress = 20 + Math.floor(p * 0.3);
        if (msg) {
          this.loadingMessage = msg;
          console.log(`[ComicViewer] Progress: ${this.progress}% - ${msg}`);
        }
        this.cdr.detectChanges();
      }, this.filename);

      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
      const imageEntries = entries.filter(e => {
        const ext = e.name.toLowerCase().split('.').pop() || '';
        return imageExts.includes(ext) && !e.name.startsWith('__MACOSX');
      });

      console.log('[ComicViewer] Found', imageEntries.length, 'image files in archive');

      imageEntries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      if (imageEntries.length === 0) {
        throw new Error('No images found in the archive.');
      }

      this.loadingMessage = `Preparing ${imageEntries.length} pages...`;
      this.progress = 55;
      this.cdr.detectChanges();

      const MAX_PRE_EXTRACT = 300; 
      const toExtract = imageEntries.slice(0, MAX_PRE_EXTRACT);
      console.log('[ComicViewer] Extracting up to', toExtract.length, 'pages...');

      for (let i = 0; i < toExtract.length; i++) {
        const entry = toExtract[i];
        try {
          const imageBlob = await entry.file.extract();
          const url = URL.createObjectURL(imageBlob);
          this.pages.push({ name: entry.name, url });
          
          this.progress = 60 + Math.round(((i + 1) / toExtract.length) * 40);
          
          if (i === 0 || i === toExtract.length - 1 || (i + 1) % 5 === 0) {
            this.loadingMessage = `Extracting Page ${i + 1} of ${toExtract.length}...`;
            console.log(`[ComicViewer] Extracted page ${i + 1}/${toExtract.length}: ${entry.name}`);
          }
          if (i % 2 === 0) this.cdr.detectChanges(); 
        } catch (err) {
          console.error(`[ComicViewer] Failed to extract page ${entry.name}`, err);
        }
      }

      console.log('[ComicViewer] Load complete. Pages:', this.pages.length);
      this.progress = 100;
      this.loading = false;
      this.cdr.detectChanges();
    } catch (err: any) {
      console.error('[ComicViewer] Error:', err);
      this.error = err.message || 'An error occurred while loading the comic.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  nextPage() {
    if (this.currentIndex < this.pages.length - 1) {
      this.currentIndex++;
      this.cdr.detectChanges();
    }
  }

  prevPage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.cdr.detectChanges();
    }
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'single' ? 'vertical' : 'single';
    this.cdr.detectChanges();
  }
}

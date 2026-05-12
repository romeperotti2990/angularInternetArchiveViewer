import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserDataService } from '../../services/user-data.service';
import { ComicViewerComponent } from '../../components/comic-viewer';
import { FilesComponent } from '../../components/files';
import { environment } from '../../../environments/environment';
import { Archive } from '../../services/archive';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule, ComicViewerComponent, FilesComponent],
  templateUrl: './media.html',
})
export class Media implements OnInit {
  displayLabel: string | null = null;
  mode: string | null = null;
  core: string | null = null;
  gameUrl: string | null = null;
  identifier: string | null = null;
  emulatorUrl: SafeResourceUrl | null = null;
  mediaUrl: SafeResourceUrl | null = null;
  mediaRawUrl: string | null = null;
  error: string | null = null;
  isLoading = false;
  documentContent: string | null = null;
  collectionTitle: string | null = null;
  collectionDescription: string | null = null;
  showFullDescription = false;
  
  itemFiles: any[] = [];
  fileLoading = false;
  fileError: string | null = null;
  private archiveAbortControllers: Record<string, AbortController> = {};

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private sanitizer: DomSanitizer, 
    private cdr: ChangeDetectorRef, 
    private userData: UserDataService,
    public archive: Archive,
    public favorites: FavoritesService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      // Clear previous file list immediately on navigation to new item
      if (this.identifier !== params.get('identifier')) {
        this.itemFiles = [];
        this.fileLoading = false;
        this.fileError = null;
      }

      this.mode = params.get('mode');
      this.core = params.get('core');
      this.gameUrl = params.get('gameUrl');
      this.identifier = params.get('identifier');
      this.displayLabel = params.get('displayLabel');
      this.collectionTitle = params.get('collectionTitle');
      this.collectionDescription = params.get('collectionDescription');
      this.error = null;
      this.emulatorUrl = null;

      // Try to restore metadata if missing (e.g. from Favorites)
      if (!this.collectionTitle || !this.collectionDescription) {
        const currentUrl = params.get('mediaUrl') ?? params.get('gameUrl') ?? '';
        const favKey = this.identifier && !currentUrl.startsWith('blob:') ? `${this.identifier}::${this.displayLabel || 'Item'}` : `history::${currentUrl}`;
        const metaRaw = localStorage.getItem(`iav:fav_meta:${favKey}`);
        if (metaRaw) {
          try {
            const meta = JSON.parse(metaRaw);
            if (!this.collectionTitle) this.collectionTitle = meta.collectionTitle;
            if (!this.collectionDescription) this.collectionDescription = meta.collectionDescription;
            if (!this.identifier) this.identifier = meta.identifier;
            if (!this.displayLabel) this.displayLabel = meta.label;
          } catch (e) {}
        }
      }

      if (this.mode === 'emulator') {
        if (!this.core || !this.gameUrl) {
          this.error = 'Missing emulator parameters (core or gameUrl).';
          return;
        }

        // Logic check for local/production backend health
        const backendOrigin = environment.backendOrigin;

        if (backendOrigin && this.gameUrl.includes(backendOrigin)) {
          // Check if the configured backend is running
          fetch(backendOrigin, { method: 'GET' })
            .then(() => {
              const url = `/emulator.html?core=${encodeURIComponent(this.core as string)}&gameUrl=${encodeURIComponent(this.gameUrl as string)}`;
              this.emulatorUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
              try { this.saveLastItem(); } catch (e) {}
              try { this.cdr.detectChanges(); } catch (e) {}
            })
            .catch(() => {
              this.error = `Backend proxy (${backendOrigin}) not reachable.`;
              try { this.cdr.detectChanges(); } catch (e) {}
            });
          return;
        }

        const url = `/emulator.html?core=${encodeURIComponent(this.core as string)}&gameUrl=${encodeURIComponent(this.gameUrl as string)}`;
        this.emulatorUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        if (!this.displayLabel) this.displayLabel = this.deriveLabel();
        // record last-viewed item
        try { this.saveLastItem(); } catch (e) {}
        try { this.cdr.detectChanges(); } catch (e) {}
        return;
      }

      if (this.mode === 'comic') {
        this.mediaRawUrl = params.get('mediaUrl') ?? params.get('gameUrl') ?? null;
        if (!this.mediaRawUrl) {
          this.error = 'Missing mediaUrl parameter for comic.';
          return;
        }
        if (!this.displayLabel) this.displayLabel = this.deriveLabel();
        try { this.saveLastItem(); } catch (e) {}
        try { this.cdr.detectChanges(); } catch (e) {}
        return;
      }

      // Handle streaming media (video, audio, image, document, text)
      if (this.mode === 'video' || this.mode === 'audio' || this.mode === 'image' || this.mode === 'document' || this.mode === 'text' || this.mode === 'other') {
        this.mediaRawUrl = params.get('mediaUrl') ?? params.get('gameUrl') ?? null;
        if (!this.mediaRawUrl) {
          this.error = 'Missing mediaUrl parameter.';
          return;
        }

        // Text mode: fetch content and display in-app
        if (this.mode === 'text') {
          this.isLoading = true;
          try {
            fetch(this.mediaRawUrl)
              .then((r) => r.text())
              .then((t) => {
                this.documentContent = t;
                this.isLoading = false;
                try { this.cdr.detectChanges(); } catch (e) {}
              })
              .catch((err) => {
                this.error = `Failed to load text: ${err?.message ?? String(err)}`;
                this.isLoading = false;
                try { this.cdr.detectChanges(); } catch (e) {}
              });
          } catch (err: any) {
            this.error = err?.message ?? String(err);
            this.isLoading = false;
          }
          return;
        }

        // document/other/video/audio/image: show in iframe/media element
        this.mediaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.mediaRawUrl);
        if (!this.displayLabel) this.displayLabel = this.deriveLabel();
        this.isLoading = true;
        // record last-viewed item
        try { this.saveLastItem(); } catch (e) {}
        try { this.cdr.detectChanges(); } catch (e) {}
        return;
      }

      if (this.mode === 'other') {
        const rawUrl = params.get('mediaUrl') ?? params.get('gameUrl') ?? '';
        if (rawUrl.toLowerCase().endsWith('.cbz') || rawUrl.toLowerCase().endsWith('.cbr')) {
           console.warn('[MediaPage] Detected CBZ/CBR in "other" mode. Redirecting to "comic" mode...');
           this.mode = 'comic';
           this.mediaRawUrl = rawUrl;
           if (!this.displayLabel) this.displayLabel = this.deriveLabel();
           try { this.saveLastItem(); } catch (e) {}
           try { this.cdr.detectChanges(); } catch (e) {}
           return;
        }
      }

      this.error = 'No emulator or media mode selected. Use /media?mode=emulator|video|audio|image|document|text|comic&...';
    });
  }

  ngOnDestroy(): void {
    // revoke blob URLs if we were given them
    try {
      if (this.mediaRawUrl && this.mediaRawUrl.startsWith && this.mediaRawUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.mediaRawUrl as string);
      }
      if (this.gameUrl && this.gameUrl.startsWith && this.gameUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.gameUrl as string);
      }
    } catch (e) {}
  }

  private deriveLabel(): string {
    if (this.displayLabel) return this.displayLabel;
    // Prefer a readable filename from the URL, fall back to mode.
    const u = (this.mode === 'emulator' ? this.gameUrl : this.mediaRawUrl) || '';
    try {
      if (!u) return 'Item';
      // If it's a blob URL, we should NOT return "Local item" as a label 
      // if we have a way to derive a better one (like from identifier/pathname)
      const parsed = new URL(u, window.location.href);
      const seg = (parsed.pathname || '').split('/').filter(Boolean).pop();
      const label = decodeURIComponent(seg || parsed.hostname || 'Item');
      return label === 'blob' ? 'Local item' : label;
    } catch (e) {
      // fallback: try to take last path-like segment
      const parts = u.split('/').filter(Boolean);
      return decodeURIComponent(parts.pop() || u.substring(0, 40) || 'Item');
    }
  }

  saveLastItem() {
    const url = this.mode === 'emulator' ? this.gameUrl : this.mediaRawUrl;
    if (!url) return;
    const item = {
      label: this.displayLabel || this.deriveLabel(),
      mode: this.mode,
      core: this.core,
      url,
      identifier: this.identifier,
      collectionTitle: this.collectionTitle,
      collectionDescription: this.collectionDescription,
      ts: Date.now(),
    } as any;

    try {
      const arr = this.userData.loadLastItems();
      // Use URL as unique key for history de-duplication
      const filtered = arr.filter((a: any) => a.url !== item.url);
      filtered.unshift(item);
      const sliced = filtered.slice(0, 50); 
      try { this.userData.saveLastItems(sliced); } catch (e) {}
      
      // Update metadata for ALL items from this collection in favorites
      const favs = this.favorites.getAll();
      for (const fKey of favs) {
        // If the favorite belongs to this identifier, update its metadata
        if (this.identifier && fKey.startsWith(this.identifier + '::')) {
          localStorage.setItem(`iav:fav_meta:${fKey}`, JSON.stringify(item));
        }
        // Also update if it's the exact same history item
        if (fKey === `history::${url}`) {
          localStorage.setItem(`iav:fav_meta:${fKey}`, JSON.stringify(item));
        }
      }
      
      try { window.dispatchEvent(new CustomEvent('iav:lastItemsUpdated')); } catch (e) {}
    } catch (e) {
      // ignore storage errors
    }
  }

  async loadItemFiles(): Promise<void> {
    if (this.itemFiles.length > 0) {
      this.itemFiles = [];
      return;
    }
    if (!this.identifier) {
      this.fileError = 'Could not find collection ID for this item.';
      return;
    }
    if (this.fileLoading) return;

    this.fileLoading = true;
    this.fileError = null;
    try { this.cdr.detectChanges(); } catch (e) {}

    const controller = new AbortController();
    const key = `collection::${this.identifier}`;
    this.archiveAbortControllers[key] = controller;

    try {
      const files = await this.archive.listFiles(this.identifier, controller.signal);
      this.itemFiles = files || [];
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Aborted') {
        this.fileError = 'Listing cancelled';
      } else {
        this.fileError = err?.message ?? String(err);
      }
    } finally {
      this.fileLoading = false;
      delete this.archiveAbortControllers[key];
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  cancelArchivePeek(filename?: string) {
    const key = filename ? `${this.identifier}::${filename}` : `collection::${this.identifier}`;
    if (this.archiveAbortControllers[key]) {
      this.archiveAbortControllers[key].abort();
    }
  }

  // called from template when media finishes loading
  onMediaLoaded() {
    this.isLoading = false;
    try { this.cdr.detectChanges(); } catch (e) {}
  }

  onMediaError(e: any) {
    this.isLoading = false;
    this.error = 'Failed to load media. Check network/CORS or open raw link.';
    try { this.cdr.detectChanges(); } catch (err) {}
  }

  async downloadMedia(): Promise<void> {
    const url = (this.mode === 'emulator' ? this.gameUrl : this.mediaRawUrl) || null;
    if (!url) {
      this.error = 'No downloadable URL available.';
      try { this.cdr.detectChanges(); } catch (e) {}
      return;
    }

    // derive filename
    let filename = this.deriveLabel() || 'download';
    try {
      const parsed = new URL(url as string, window.location.href);
      const seg = (parsed.pathname || '').split('/').filter(Boolean).pop();
      if (seg) filename = decodeURIComponent(seg);
    } catch (e) {}

    try {
      // If it's already a blob URL (e.g. from an extracted zip or local file), 
      // trigger it via simple <a> tag click.
      if (typeof url === 'string' && url.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      // For normal URLs, we FETCH first and then trigger a blob download.
      // This is the ONLY way to guarantee Chrome doesn't just navigate to the proxy URL
      // when it encounters a filetype it thinks it can just "display" (like an MP4 or PDF).
      // Since it's a large file, the browser will show the fetch progress if we use native streams,
      // but providing a single blob at the end is the most reliable "Save As" trigger.
      const resp = await fetch(url as string);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err: any) {
      console.error('[Media] Download failed:', err);
      // Absolute last resort: open in new tab
      window.open(url as string, '_blank');
      this.error = `Download failed; opening raw link.`;
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }
}

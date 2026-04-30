import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserDataService } from '../../services/user-data.service';
import { ComicViewerComponent } from '../../components/comic-viewer/comic-viewer';
import { environment } from '../../../environments/environment';
import { Archive } from '../../services/archive';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule, ComicViewerComponent],
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
      if (u.startsWith('blob:')) return 'Local item';
      const parsed = new URL(u, window.location.href);
      const seg = (parsed.pathname || '').split('/').filter(Boolean).pop();
      return decodeURIComponent(seg || parsed.hostname || 'Item');
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

    try {
      const files = await this.archive.listFiles(this.identifier);
      this.itemFiles = files || [];
    } catch (err: any) {
      this.fileError = err?.message ?? String(err);
    } finally {
      this.fileLoading = false;
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  isEmulatorFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['gba', 'gbc', 'gb', 'nes', 'snes', 'gen', 'md', 'sms', 'gg', 'n64', 'z64', 'v64'].includes(ext);
  }

  isArchiveFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['zip', '7z', 'rar', 'tar', 'gz'].includes(ext);
  }

  getFileUrl(identifier: string, filename: string): string {
    return this.archive.getFileUrl(identifier, filename);
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  openFile(identifier: string, filename: string, collectionTitle?: string, collectionDescription?: string) {
    const mode = this.archive.getModeForFilename(filename);
    const url = this.archive.getFileUrl(identifier, filename);
    
    // Check if we are passing new collections, or fall back to current page's metadata
    const finalTitle = collectionTitle || this.collectionTitle;
    const finalDesc = collectionDescription || this.collectionDescription;

    const qp: any = { 
      mode, 
      displayLabel: filename, 
      identifier,
      collectionTitle: finalTitle,
      collectionDescription: finalDesc
    };

    if (mode === 'emulator') {
      qp.core = this.archive.getEmulatorCore(filename);
      qp.gameUrl = url;
    } else {
      qp.mediaUrl = url;
    }

    this.router.navigate(['/media'], { queryParams: qp });
  }

  openInEmulator(identifier: string, filename: string, collectionTitle?: string, collectionDescription?: string) {
    this.openFile(identifier, filename, collectionTitle, collectionDescription);
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

    try {
      // If it's already a blob URL, just trigger download
      if (url.startsWith && url.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = this.deriveLabel() || 'download';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      // Attempt to fetch the resource (may fail due to CORS)
      const resp = await fetch(url as string);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);

      // derive filename from URL path or fallback to label
      let filename = this.deriveLabel() || 'download';
      try {
        const parsed = new URL(url as string, window.location.href);
        const seg = (parsed.pathname || '').split('/').filter(Boolean).pop();
        if (seg) filename = decodeURIComponent(seg);
      } catch (e) {}

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }, 5000);
    } catch (err: any) {
      // Fallback: open raw resource in new tab
      try { window.open(url as string, '_blank'); } catch (e) {}
      this.error = `Download failed; opened raw. ${err?.message ?? ''}`;
    } finally {
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }
}

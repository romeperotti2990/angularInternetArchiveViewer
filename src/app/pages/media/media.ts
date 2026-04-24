import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserDataService } from '../../services/user-data.service';
import { ComicViewerComponent } from '../../components/comic-viewer/comic-viewer';
import { environment } from '../../../environments/environment';

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
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef, private userData: UserDataService) {}

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
      
      console.log('[MediaPage] Params received:', {
        mode: this.mode,
        gameUrl: this.gameUrl,
        mediaUrl: params.get('mediaUrl'),
        displayLabel: this.displayLabel
      });

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
        console.log('Media Page: Comic mode active, URL:', this.mediaRawUrl);
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

  private saveLastItem() {
    const url = this.mode === 'emulator' ? this.gameUrl : this.mediaRawUrl;
    if (!url) return;
    const item = {
      label: this.displayLabel || this.deriveLabel(),
      mode: this.mode,
      core: this.core,
      url,
      collectionTitle: this.collectionTitle,
      collectionDescription: this.collectionDescription,
      ts: Date.now(),
    } as any;

    try {
      const arr = this.userData.loadLastItems();
      const filtered = arr.filter((a: any) => a.url !== item.url);
      filtered.unshift(item);
      const sliced = filtered.slice(0, 10);
      try { this.userData.saveLastItems(sliced); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('iav:lastItemsUpdated')); } catch (e) {}
    } catch (e) {
      // ignore storage errors
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

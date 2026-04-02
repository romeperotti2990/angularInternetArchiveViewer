import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media.html',
  styleUrl: './media.css',
})
export class Media implements OnInit {
  mode: string | null = null;
  core: string | null = null;
  gameUrl: string | null = null;
  emulatorUrl: SafeResourceUrl | null = null;
  mediaUrl: SafeResourceUrl | null = null;
  mediaRawUrl: string | null = null;
  error: string | null = null;
  isLoading = false;
  documentContent: string | null = null;
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.mode = params.get('mode');
      this.core = params.get('core');
      this.gameUrl = params.get('gameUrl');
      this.error = null;
      this.emulatorUrl = null;

      if (this.mode === 'emulator') {
        if (!this.core || !this.gameUrl) {
          this.error = 'Missing emulator parameters (core or gameUrl).';
          return;
        }

        // If the gameUrl uses our local backend proxy, verify the backend is reachable.
        let shouldPingBackend = false;
        try {
          const u = new URL(this.gameUrl);
          if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') shouldPingBackend = true;
        } catch (e) {
          // ignore - if URL parsing fails we'll still try to use it
        }

        if (shouldPingBackend) {
          const backendOrigin = (() => {
            try {
              return new URL(this.gameUrl as string).origin;
            } catch (e) {
              return null;
            }
          })();

          if (backendOrigin) {
            // quick ping to backend origin to see if it's running
            fetch(backendOrigin, { method: 'GET' })
              .then((r) => {
                // proceed to open emulator regardless of status code
                const url = `/emulator.html?core=${encodeURIComponent(this.core as string)}&gameUrl=${encodeURIComponent(this.gameUrl as string)}`;
                this.emulatorUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                // record last-viewed item (backend path)
                try { this.saveLastItem(); } catch (e) {}
                try { this.cdr.detectChanges(); } catch (e) {}
              })
              .catch(() => {
                this.error = 'Backend proxy not reachable. Start it with: npm run start-backend';
                try { this.cdr.detectChanges(); } catch (e) {}
              });
            return;
          }
        }

        const url = `/emulator.html?core=${encodeURIComponent(this.core as string)}&gameUrl=${encodeURIComponent(this.gameUrl as string)}`;
        this.emulatorUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        // prevent arrow keys from scrolling the page while emulator is active
        this.addPreventArrowScroll();
        // record last-viewed item
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
        this.isLoading = true;
        // record last-viewed item
        try { this.saveLastItem(); } catch (e) {}
        try { this.cdr.detectChanges(); } catch (e) {}
        return;
      }

      this.error = 'No emulator or media mode selected. Use /media?mode=emulator|video|audio|image|document|text&...';
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
    this.removePreventArrowScroll();
  }

  private deriveLabel(): string {
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
      label: this.deriveLabel(),
      mode: this.mode,
      core: this.core,
      url,
      ts: Date.now(),
    } as any;

    try {
      const key = 'iav:lastItems';
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      // dedupe by url
      const filtered = arr.filter((a: any) => a.url !== item.url);
      filtered.unshift(item);
      const sliced = filtered.slice(0, 10);
      localStorage.setItem(key, JSON.stringify(sliced));
      // notify other components in-page
      try { window.dispatchEvent(new CustomEvent('iav:lastItemsUpdated')); } catch (e) {}
    } catch (e) {
      // ignore storage errors
    }
  }

  private addPreventArrowScroll() {
    this.removePreventArrowScroll();
    this._keydownHandler = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
      if (keys.includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', this._keydownHandler, { passive: false });
  }

  private removePreventArrowScroll() {
    if (this._keydownHandler) {
      window.removeEventListener('keydown', this._keydownHandler as any);
      this._keydownHandler = null;
    }
  }

  // called from template when media finishes loading
  onMediaLoaded() {
    this.isLoading = false;
    try { this.cdr.detectChanges(); } catch (e) {}
  }
}

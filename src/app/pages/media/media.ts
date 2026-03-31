import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  error: string | null = null;

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
        try { this.cdr.detectChanges(); } catch (e) {}
      } else {
        this.error = 'No emulator mode selected. Use /media?mode=emulator&core=<core>&gameUrl=<url>.';
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
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

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

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

        const url = `/emulator.html?core=${encodeURIComponent(this.core)}&gameUrl=${encodeURIComponent(this.gameUrl)}`;
        this.emulatorUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      } else {
        this.error = 'No emulator mode selected. Use /media?mode=emulator&core=<core>&gameUrl=<url>.';
      }
    });
  }
}

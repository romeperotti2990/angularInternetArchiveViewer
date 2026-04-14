import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  lastItems: any[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    this.loadLastItems();
    // listen for updates triggered by Media.saveLastItem
    try { window.addEventListener('iav:lastItemsUpdated', () => this.loadLastItems()); } catch (e) {}
  }

  // media filter UI
  mediaTypes = ['software', 'movies', 'texts', 'audio'];
  selectedMedia: Record<string, boolean> = {};

  toggleMedia(mt: string) {
    this.selectedMedia[mt] = !this.selectedMedia[mt];
    try { this.cdr.detectChanges(); } catch (e) {}
  }

  // Update query params when toggling filters so Search page reacts.
  toggleMediaAndSync(mt: string) {
    this.toggleMedia(mt);
    try {
      const media = Object.keys(this.selectedMedia).filter((k) => this.selectedMedia[k]);
      // If we're on the search page, update the `media` query param to trigger a search update.
      if (this.router.url && this.router.url.startsWith('/search')) {
        const qp: any = {};
        if (media.length) qp.media = media.join(',');
        else qp.media = null; // remove param to allow default mediatypes
        this.router.navigate([], { queryParams: qp, queryParamsHandling: 'merge' });
      }
    } catch (e) {
      // ignore navigation errors
    }
  }

  private getSelectedMediaArray(): string[] {
    return Object.keys(this.selectedMedia).filter((k) => this.selectedMedia[k]);
  }

  onSearch(query: string) {
    const q = (query || '').trim();
    console.log('[Navbar] onSearch called with:', q);
    if (!q) return;
    const media = this.getSelectedMediaArray();
    const qp: any = { q };
    if (media.length) qp.media = media.join(',');
    this.router.navigate(['/search'], { queryParams: qp });
  }

  private loadLastItems() {
    try {
      const raw = localStorage.getItem('iav:lastItems');
      this.lastItems = raw ? JSON.parse(raw) : [];
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (e) {
      this.lastItems = [];
    }
  }

  openLastItem(item: any) {
    if (!item || !item.url) return;
    const qp: any = { mode: item.mode };
    if (item.core) qp.core = item.core;
    // use the same param name used elsewhere
    qp[(item.mode === 'emulator') ? 'gameUrl' : 'mediaUrl'] = item.url;
    this.router.navigate(['/media'], { queryParams: qp });
  }

  get limitedLastItems(): any[] {
    return this.lastItems.slice(0, 4);
  }

  get hasMoreItems(): boolean {
    return this.lastItems.length > 4;
  }

  get totalItemsCount(): number {
    return this.lastItems.length;
  }
}

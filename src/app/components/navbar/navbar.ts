import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  // media filter UI
  mediaTypes = ['software', 'movies', 'texts', 'audio'];
  selectedMedia: Record<string, boolean> = {};

  toggleMedia(mt: string) {
    this.selectedMedia[mt] = !this.selectedMedia[mt];
    try { this.cdr.detectChanges(); } catch (e) {}
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
}

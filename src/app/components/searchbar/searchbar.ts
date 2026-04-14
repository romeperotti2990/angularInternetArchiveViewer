import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchbar.html',
  styleUrls: ['./searchbar.css'],
})
export class Searchbar implements OnInit {
  query = '';
  expanded = false;
  mediaTypes = ['software', 'movies', 'texts', 'audio'];
  selectedMedia: Record<string, boolean> = {};

  constructor(private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.query = params.get('q') ?? '';
      const mediaParam = params.get('media') ?? '';
      this.selectedMedia = {};
      if (mediaParam) {
        for (const m of mediaParam.split(',').map((s) => s.trim()).filter(Boolean)) {
          this.selectedMedia[m] = true;
        }
      }

      const hasFilters = Object.keys(this.selectedMedia).some((key) => this.selectedMedia[key]);
      this.expanded = Boolean(this.query || hasFilters);
      try { this.cdr.detectChanges(); } catch (e) {}
    });
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  toggleMedia(mt: string): void {
    this.selectedMedia[mt] = !this.selectedMedia[mt];
    try { this.cdr.detectChanges(); } catch (e) {}
    if (this.router.url.startsWith('/search') && this.query.trim()) {
      this.submit();
    }
  }

  submit(): void {
    const q = this.query.trim();
    const media = Object.keys(this.selectedMedia).filter((key) => this.selectedMedia[key]);
    if (!q) {
      if (!media.length) {
        this.router.navigate(['/']);
      }
      return;
    }

    const qp: any = { q };
    if (media.length) qp.media = media.join(',');
    this.router.navigate(['/search'], { queryParams: qp });
  }

  resetAll(): void {
    this.query = '';
    this.selectedMedia = {};
    try { this.cdr.detectChanges(); } catch (e) {}
    if (this.router.url.startsWith('/search')) {
      this.router.navigate(['/']);
    }
  }

  clearFilters(): void {
    this.selectedMedia = {};
    try { this.cdr.detectChanges(); } catch (e) {}
    if (this.router.url.startsWith('/search')) {
      this.submit();
    }
  }

  activeFilterCount(): number {
    return Object.keys(this.selectedMedia).filter((key) => this.selectedMedia[key]).length;
  }
}
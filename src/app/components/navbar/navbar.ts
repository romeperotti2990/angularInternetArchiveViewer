import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { UserDataService } from '../../services/user-data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
})
export class Navbar {
  lastItems: any[] = [];
  visibleLastItems: any[] = [];
  hiddenLastItemsCount = 0;

  @ViewChild('historyViewport') historyViewport?: ElementRef<HTMLElement>;
  @ViewChildren('historyMeasureItem') historyMeasureItems?: QueryList<ElementRef<HTMLElement>>;

  private resizeObserver: ResizeObserver | null = null;
  private layoutFrame = 0;

  constructor(private router: Router, private cdr: ChangeDetectorRef, public favorites: FavoritesService, public auth: AuthService, private userData: UserDataService) {
    this.loadLastItems();
    try { this.auth.user$.subscribe(() => this.loadLastItems()); } catch (e) {}
    // listen for updates triggered by Media.saveLastItem
    try { window.addEventListener('iav:lastItemsUpdated', () => this.loadLastItems()); } catch (e) {}
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.scheduleLayout();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.layoutFrame) {
      cancelAnimationFrame(this.layoutFrame);
      this.layoutFrame = 0;
    }
  }

  private loadLastItems() {
    try {
      this.lastItems = this.userData.loadLastItems();
      this.scheduleLayout();
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (e) {
      this.lastItems = [];
      this.visibleLastItems = [];
      this.hiddenLastItemsCount = 0;
    }
  }

  private setupResizeObserver() {
    const viewport = this.historyViewport?.nativeElement;
    if (!viewport || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.scheduleLayout());
    this.resizeObserver.observe(viewport);
  }

  private scheduleLayout() {
    if (this.layoutFrame) cancelAnimationFrame(this.layoutFrame);
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = 0;
      this.recalculateVisibleItems();
    });
  }

  private recalculateVisibleItems() {
    const viewport = this.historyViewport?.nativeElement;
    if (!viewport || !this.lastItems.length) {
      this.visibleLastItems = [];
      this.hiddenLastItemsCount = 0;
      try { this.cdr.detectChanges(); } catch (e) {}
      return;
    }

    const measureItems = this.historyMeasureItems?.toArray() ?? [];
    if (!measureItems.length) {
      this.visibleLastItems = this.lastItems.slice(0, 4);
      this.hiddenLastItemsCount = Math.max(0, this.lastItems.length - this.visibleLastItems.length);
      try { this.cdr.detectChanges(); } catch (e) {}
      return;
    }

    const availableWidth = viewport.clientWidth;
    const itemGap = 12;
    const moreChipWidth = this.lastItems.length > 1 ? 88 : 0;
    let usedWidth = 0;
    let visibleCount = 0;

    for (let i = 0; i < measureItems.length; i++) {
      const itemWidth = Math.ceil(measureItems[i].nativeElement.getBoundingClientRect().width);
      const nextWidth = usedWidth + itemWidth + (visibleCount > 0 ? itemGap : 0);
      const remaining = this.lastItems.length - (visibleCount + 1);
      const reserveMore = remaining > 0 ? moreChipWidth : 0;
      if (nextWidth + reserveMore <= availableWidth) {
        usedWidth = nextWidth;
        visibleCount += 1;
        continue;
      }
      break;
    }

    if (visibleCount === 0 && this.lastItems.length) visibleCount = 1;

    this.visibleLastItems = this.lastItems.slice(0, visibleCount);
    this.hiddenLastItemsCount = Math.max(0, this.lastItems.length - visibleCount);
    try { this.cdr.detectChanges(); } catch (e) {}
  }

  openLastItem(item: any) {
    if (!item || !item.url) return;
    const qp: any = { mode: item.mode };
    if (item.core) qp.core = item.core;
    if (item.collectionTitle) qp.collectionTitle = item.collectionTitle;
    if (item.collectionDescription) qp.collectionDescription = item.collectionDescription;
    // use the same param name used elsewhere
    qp[(item.mode === 'emulator') ? 'gameUrl' : 'mediaUrl'] = item.url;
    this.router.navigate(['/media'], { queryParams: qp });
  }

  get hasMoreItems(): boolean {
    return this.hiddenLastItemsCount > 0;
  }

  get totalItemsCount(): number {
    return this.lastItems.length;
  }

  async signOut() {
    try {
      await this.auth.signOut();
      try { this.router.navigate(['/login']); } catch (e) {}
    } catch (e) {}
  }
}

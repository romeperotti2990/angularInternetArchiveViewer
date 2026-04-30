import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserDataService } from '../../services/user-data.service';
import { AuthService } from '../../services/auth.service';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
})
export class HistoryPage {
  lastItems: any[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userData: UserDataService,
    private auth: AuthService,
    public favorites: FavoritesService
  ) {
    this.loadLastItems();
    try { this.auth.user$.subscribe(() => this.loadLastItems()); } catch (e) {}
    try { window.addEventListener('iav:lastItemsUpdated', () => this.loadLastItems()); } catch (e) {}
    try { this.favorites.favorites$.subscribe(() => this.cdr.detectChanges()); } catch (e) {}
  }

  private loadLastItems() {
    try {
      this.lastItems = this.userData.loadLastItems();
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (e) {
      this.lastItems = [];
    }
  }

  openLastItem(item: any) {
    if (!item || !item.url) return;
    const qp: any = { 
      mode: item.mode,
      displayLabel: item.label || item.displayLabel,
      identifier: item.identifier
    };
    if (item.core) qp.core = item.core;
    if (item.collectionTitle) qp.collectionTitle = item.collectionTitle;
    if (item.collectionDescription) qp.collectionDescription = item.collectionDescription;
    qp[(item.mode === 'emulator') ? 'gameUrl' : 'mediaUrl'] = item.url;
    this.router.navigate(['/media'], { queryParams: qp });
  }

  toggleFavorite(event: Event, item: any) {
    event.stopPropagation();
    if (item && item.url) {
      this.favorites.toggle('history::' + item.url, item);
    }
  }

  async clearHistory() {
    if (!confirm('Are you sure you want to clear your entire play history?')) return;
    try {
      await this.userData.saveLastItems([]);
      this.loadLastItems();
      window.dispatchEvent(new CustomEvent('iav:lastItemsUpdated'));
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  }
}

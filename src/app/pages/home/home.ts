import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { Archive } from '../../services/archive';
import { UserDataService } from '../../services/user-data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
})
export class HomePage {
  lastItems: any[] = [];
  favoritesKeys: string[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef, public favorites: FavoritesService, private archive: Archive, private userData: UserDataService, private auth: AuthService) {
    this.loadLastItems();
    this.loadFavorites();
    try { this.auth.user$.subscribe(() => this.loadLastItems()); } catch (e) {}
    try { window.addEventListener('iav:lastItemsUpdated', () => this.loadLastItems()); } catch (e) {}
    try { window.addEventListener('iav:lastItemsUpdated', () => this.loadFavorites()); } catch (e) {}
    // subscribe to favorites changes to update view
    try { this.favorites.favorites$.subscribe(() => this.loadFavorites()); } catch (e) {}
  }

  private loadLastItems() {
    try {
      this.lastItems = this.userData.loadLastItems();
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (e) {
      this.lastItems = [];
    }
  }

  private loadFavorites() {
    try {
      this.favoritesKeys = this.favorites.getAll();
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (e) {
      this.favoritesKeys = [];
    }
  }

  openFavorite(key: string) {
    if (!key) return;
    // history favorite: 'history::<url>'
    if (key.startsWith('history::')) {
      const url = key.substring('history::'.length);
      const found = this.lastItems.find((i) => i.url === url);
      if (found) return this.openLastItem(found);

      // Fallback: If not in history, derive mode and core from URL to allow opening
      const mode = this.archive.getModeForFilename(url);
      const qp: any = { mode };
      if (mode === 'emulator') {
        qp.gameUrl = url;
        qp.core = this.archive.getEmulatorCore(url);
      } else {
        qp.mediaUrl = url;
      }
      // Note: Identifier is missing in this fallback case
      this.router.navigate(['/media'], { queryParams: qp });
      return;
    }

    // file favorite: identifier::fileName[::entryName...]
    const parts = key.split('::');
    if (parts.length >= 2) {
      const identifier = parts[0];
      const filePath = parts.slice(1).join('::');
      try {
        const url = this.archive.getFileUrl(identifier, filePath);
        const mode = this.archive.getModeForFilename(filePath);
        if (mode === 'emulator') {
          const core = this.archive.getEmulatorCore(filePath);
          const qp: any = { mode: 'emulator', core, gameUrl: url, displayLabel: filePath, identifier };
          this.router.navigate(['/media'], { queryParams: qp });
        } else {
          const qp: any = { mode, mediaUrl: url, displayLabel: filePath, identifier };
          this.router.navigate(['/media'], { queryParams: qp });
        }
      } catch (e) {
        try { window.open(filePath, '_blank'); } catch (err) {}
      }
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
}

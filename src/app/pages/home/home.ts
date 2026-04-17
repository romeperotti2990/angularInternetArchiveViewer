import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { Archive } from '../../services/archive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage {
  lastItems: any[] = [];
  favoritesKeys: string[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef, public favorites: FavoritesService, private archive: Archive) {
    this.loadLastItems();
    this.loadFavorites();
    try { window.addEventListener('iav:lastItemsUpdated', () => this.loadLastItems()); } catch (e) {}
    try { window.addEventListener('iav:lastItemsUpdated', () => this.loadFavorites()); } catch (e) {}
    // subscribe to favorites changes to update view
    try { this.favorites.favorites$.subscribe(() => this.loadFavorites()); } catch (e) {}
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
      try { window.open(url, '_blank'); } catch (e) {}
      return;
    }

    // file favorite: identifier::fileName[::entryName...]
    const parts = key.split('::');
    if (parts.length >= 2) {
      const identifier = parts[0];
      const filePath = parts.slice(1).join('::');
      try {
        const url = this.archive.getFileUrl(identifier, filePath);
        try { window.open(url, '_blank'); } catch (e) {}
      } catch (e) {
        try { window.open(filePath, '_blank'); } catch (err) {}
      }
    }
  }

  openLastItem(item: any) {
    if (!item || !item.url) return;
    const qp: any = { mode: item.mode };
    if (item.core) qp.core = item.core;
    if (item.collectionTitle) qp.collectionTitle = item.collectionTitle;
    if (item.collectionDescription) qp.collectionDescription = item.collectionDescription;
    qp[(item.mode === 'emulator') ? 'gameUrl' : 'mediaUrl'] = item.url;
    this.router.navigate(['/media'], { queryParams: qp });
  }
}

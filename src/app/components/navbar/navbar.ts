import { Component, ChangeDetectorRef } from '@angular/core';
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
  styleUrl: './navbar.css',
})
export class Navbar {
  lastItems: any[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef, public favorites: FavoritesService, public auth: AuthService, private userData: UserDataService) {
    this.loadLastItems();
    try { this.auth.user$.subscribe(() => this.loadLastItems()); } catch (e) {}
    // listen for updates triggered by Media.saveLastItem
    try { window.addEventListener('iav:lastItemsUpdated', () => this.loadLastItems()); } catch (e) {}
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
    const qp: any = { mode: item.mode };
    if (item.core) qp.core = item.core;
    if (item.collectionTitle) qp.collectionTitle = item.collectionTitle;
    if (item.collectionDescription) qp.collectionDescription = item.collectionDescription;
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

  async signOut() {
    try {
      await this.auth.signOut();
      try { this.router.navigate(['/login']); } catch (e) {}
    } catch (e) {}
  }
}

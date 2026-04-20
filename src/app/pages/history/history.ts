import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserDataService } from '../../services/user-data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
})
export class HistoryPage {
  lastItems: any[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef, private userData: UserDataService, private auth: AuthService) {
    this.loadLastItems();
    try { this.auth.user$.subscribe(() => this.loadLastItems()); } catch (e) {}
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
    qp[(item.mode === 'emulator') ? 'gameUrl' : 'mediaUrl'] = item.url;
    this.router.navigate(['/media'], { queryParams: qp });
  }

  clearHistory() {
    try {
      try { window.dispatchEvent(new CustomEvent('iav:lastItemsUpdated')); } catch (e) {}
      try { this.userData.saveLastItems([]); } catch (e) {}
      this.loadLastItems();
    } catch (e) {}
  }
}

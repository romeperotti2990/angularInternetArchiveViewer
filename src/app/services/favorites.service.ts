import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserDataService } from './user-data.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private favorites = new Set<string>();
  private subj = new BehaviorSubject<Set<string>>(new Set());

  favorites$ = this.subj.asObservable();

  constructor(private userData: UserDataService, private auth: AuthService) {
    try {
      this.auth.user$.subscribe(() => this.reloadFromStorage());
    } catch (e) {}
    
    // Also reload when common events happen
    try {
      window.addEventListener('iav:lastItemsUpdated', () => this.reloadFromStorage());
    } catch (e) {}

    this.reloadFromStorage();
  }

  private persist() {
    this.subj.next(new Set(this.favorites));
    try { this.userData.saveFavorites(Array.from(this.favorites)); } catch (e) {}
  }

  private reloadFromStorage() {
    this.favorites = new Set(this.userData.loadFavorites());
    this.subj.next(new Set(this.favorites));
  }

  isFavorited(key: string): boolean {
    return this.favorites.has(key);
  }

  add(key: string) {
    this.favorites.add(key);
    this.persist();
  }

  remove(key: string) {
    this.favorites.delete(key);
    try { localStorage.removeItem(`iav:fav_meta:${key}`); } catch (e) {}
    this.persist();
  }

  toggle(key: string, metadata?: any) {
    if (this.isFavorited(key)) {
      this.remove(key);
    } else {
      if (metadata) {
        try {
          localStorage.setItem(`iav:fav_meta:${key}`, JSON.stringify(metadata));
        } catch (e) {}
      }
      this.add(key);
    }
  }

  /** Return all favorite keys as an array (snapshot) */
  getAll(): string[] {
    return Array.from(this.favorites);
  }
}

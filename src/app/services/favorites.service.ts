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
    this.persist();
  }

  toggle(key: string) {
    if (this.isFavorited(key)) this.remove(key);
    else this.add(key);
  }

  /** Return all favorite keys as an array (snapshot) */
  getAll(): string[] {
    return Array.from(this.favorites);
  }
}

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
    this.rebuildUrlMap();
    this.subj.next(new Set(this.favorites));
  }

  private urlToKeyMap = new Map<string, string>();

  private rebuildUrlMap() {
    this.urlToKeyMap.clear();
    for (const key of this.favorites) {
      try {
        const metaRaw = localStorage.getItem(`iav:fav_meta:${key}`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          if (meta.url) {
            this.urlToKeyMap.set(meta.url, key);
          }
          // Also map by identifier for collection-level matching
          if (meta.identifier && !key.includes('::')) {
            this.urlToKeyMap.set(`id:${meta.identifier}`, key);
          }
        } else if (key.startsWith('history::')) {
          // If it's a history favorite, the URL is in the key itself
          this.urlToKeyMap.set(key.replace('history::', ''), key);
        } else if (!key.includes('::')) {
          // Plain identifier favorite
          this.urlToKeyMap.set(`id:${key}`, key);
        }
      } catch (e) {}
    }
  }

  isFavorited(key: string): boolean {
    if (this.favorites.has(key)) return true;
    
    // Check if we already have this URL or Identifier favorited under a different key
    try {
      let currentUrl: string | null = null;
      let currentId: string | null = null;

      if (key.startsWith('history::')) {
        currentUrl = key.replace('history::', '');
      } else if (!key.includes('::')) {
        currentId = key;
      } else {
        const metaRaw = localStorage.getItem(`iav:fav_meta:${key}`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          currentUrl = meta.url;
          currentId = meta.identifier;
        }
      }

      if (currentUrl && this.urlToKeyMap.has(currentUrl)) {
        return true;
      }
      if (currentId && this.urlToKeyMap.has(`id:${currentId}`)) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Returns the canonical favorited key if a match is found.
   */
  getExistingFavoriteKey(key: string): string {
    if (this.favorites.has(key)) return key;
    try {
      let currentUrl: string | null = null;
      let currentId: string | null = null;

      if (key.startsWith('history::')) {
        currentUrl = key.replace('history::', '');
      } else if (!key.includes('::')) {
        currentId = key;
      } else {
        const metaRaw = localStorage.getItem(`iav:fav_meta:${key}`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          currentUrl = meta.url;
          currentId = meta.identifier;
        }
      }
      
      if (currentUrl && this.urlToKeyMap.has(currentUrl)) {
        return this.urlToKeyMap.get(currentUrl)!;
      }
      if (currentId && this.urlToKeyMap.has(`id:${currentId}`)) {
        return this.urlToKeyMap.get(`id:${currentId}`)!;
      }
    } catch (e) {}
    return key;
  }

  add(key: string) {
    this.favorites.add(key);
    this.persist();
    this.rebuildUrlMap();
  }

  remove(key: string) {
    this.favorites.delete(key);
    try { localStorage.removeItem(`iav:fav_meta:${key}`); } catch (e) {}
    this.persist();
    this.rebuildUrlMap();
  }

  toggle(key: string, metadata?: any) {
    // metadata storage must happen BEFORE checking isFavorited so isFavorited can see the URL
    if (metadata) {
      try {
        localStorage.setItem(`iav:fav_meta:${key}`, JSON.stringify(metadata));
      } catch (e) {}
    }

    const canonicalKey = this.getExistingFavoriteKey(key);
    
    if (this.favorites.has(canonicalKey)) {
      this.remove(canonicalKey);
    } else {
      this.add(key);
    }
  }

  /** Return all favorite keys as an array (snapshot) */
  getAll(): string[] {
    return Array.from(this.favorites);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'iav:favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private favorites = new Set<string>(this.loadFromStorage());
  private subj = new BehaviorSubject<Set<string>>(new Set(this.favorites));

  favorites$ = this.subj.asObservable();

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.favorites)));
    } catch (e) {
      // ignore
    }
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

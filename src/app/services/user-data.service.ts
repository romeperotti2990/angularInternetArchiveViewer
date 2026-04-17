import { Injectable } from '@angular/core';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';

const FAVORITES_KEY = 'iav:favorites';
const LASTITEMS_KEY = 'iav:lastItems';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private uid: string | null = null;

  constructor(private auth: AuthService) {
    // react to auth state changes
    try { this.auth.user$.subscribe((u: any) => this.onAuthChanged(u)); } catch (e) {}
  }

  private async onAuthChanged(user: any) {
    if (user && user.uid) {
      this.uid = user.uid;
      await this.syncLocalToRemote();
    } else {
      this.uid = null;
    }
  }

  private async syncLocalToRemote() {
    if (!this.uid) return;
    try {
      const db = getFirestore();
      const ref = doc(db, 'users', this.uid);
      const snap = await getDoc(ref);
      const remote = snap.exists() ? (snap.data() as any) : {};

      const localFavorites = this.loadLocalFavorites();
      const remoteFavorites = Array.isArray(remote.favorites) ? remote.favorites : [];
      const mergedFavorites = Array.from(new Set([...remoteFavorites, ...localFavorites]));

      const localLast = this.loadLocalLastItems();
      const remoteLast = Array.isArray(remote.lastItems) ? remote.lastItems : [];
      // merge last items by url, prefer most recent from local then remote
      const combined = [...localLast, ...remoteLast];
      const seen = new Set<string>();
      const mergedLast: any[] = [];
      for (const it of combined) {
        if (!it || !it.url) continue;
        if (!seen.has(it.url)) {
          seen.add(it.url);
          mergedLast.push(it);
        }
      }
      const slicedLast = mergedLast.slice(0, 50);

      // persist merged data to remote and local
      await setDoc(ref, { favorites: mergedFavorites, lastItems: slicedLast }, { merge: true });
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(mergedFavorites)); } catch (e) {}
      try { localStorage.setItem(LASTITEMS_KEY, JSON.stringify(slicedLast)); } catch (e) {}
    } catch (e) {
      // ignore sync errors
    }
  }

  private loadLocalFavorites(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  private loadLocalLastItems(): any[] {
    try {
      const raw = localStorage.getItem(LASTITEMS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  async saveFavorites(keys: string[]) {
    if (!this.uid) return;
    try {
      const db = getFirestore();
      const ref = doc(db, 'users', this.uid);
      await setDoc(ref, { favorites: keys }, { merge: true });
    } catch (e) {
      // ignore
    }
  }

  async saveLastItems(items: any[]) {
    if (!this.uid) return;
    try {
      const db = getFirestore();
      const ref = doc(db, 'users', this.uid);
      await setDoc(ref, { lastItems: items.slice(0, 50) }, { merge: true });
    } catch (e) {
      // ignore
    }
  }
}

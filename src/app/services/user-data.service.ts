import { Injectable } from '@angular/core';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';

const FAVORITES_KEY = 'iav:favorites';
const LASTITEMS_KEY = 'iav:lastItems';
const ANONYMOUS_SCOPE = 'anonymous';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private uid: string | null = null;

  constructor(private auth: AuthService) {
    // react to auth state changes
    try { this.auth.user$.subscribe((u: any) => this.onAuthChanged(u)); } catch (e) {}
  }

  private async onAuthChanged(user: any) {
    this.uid = user && user.uid ? user.uid : null;
    if (this.uid) {
      await this.syncLocalToRemote();
    }
  }

  getCurrentUserId(): string | null {
    return this.uid;
  }

  private scopeKey(baseKey: string, uid: string | null = this.uid): string {
    return `${baseKey}:${uid || ANONYMOUS_SCOPE}`;
  }

  private loadScopedArray<T>(baseKey: string, uid: string | null = this.uid): T[] {
    try {
      const raw = localStorage.getItem(this.scopeKey(baseKey, uid));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  private saveScopedArray(baseKey: string, value: any[], uid: string | null = this.uid) {
    try {
      localStorage.setItem(this.scopeKey(baseKey, uid), JSON.stringify(value));
    } catch (e) {
      // ignore storage errors
    }
  }

  loadFavorites(): string[] {
    return this.loadScopedArray<string>(FAVORITES_KEY);
  }

  loadLastItems(): any[] {
    return this.loadScopedArray<any>(LASTITEMS_KEY);
  }

  private async syncLocalToRemote() {
    if (!this.uid) return;
    try {
      const db = getFirestore();
      const ref = doc(db, 'users', this.uid);
      const snap = await getDoc(ref);
      const remote = snap.exists() ? (snap.data() as any) : {};

      const localFavorites = this.loadScopedArray<string>(FAVORITES_KEY, this.uid);
      const remoteFavorites = Array.isArray(remote.favorites) ? remote.favorites : [];
      const shouldAdoptAnonymousFavorites = localFavorites.length === 0 && remoteFavorites.length === 0;
      const anonymousFavorites = shouldAdoptAnonymousFavorites ? this.loadScopedArray<string>(FAVORITES_KEY, null) : [];
      const mergedFavorites = Array.from(new Set([...remoteFavorites, ...localFavorites, ...anonymousFavorites]));

      const localLast = this.loadScopedArray<any>(LASTITEMS_KEY, this.uid);
      const remoteLast = Array.isArray(remote.lastItems) ? remote.lastItems : [];
      // merge last items by url, prefer most recent from local then remote
      const shouldAdoptAnonymousLast = localLast.length === 0 && remoteLast.length === 0;
      const anonymousLast = shouldAdoptAnonymousLast ? this.loadScopedArray<any>(LASTITEMS_KEY, null) : [];
      const combined = [...localLast, ...anonymousLast, ...remoteLast];
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
      this.saveScopedArray(FAVORITES_KEY, mergedFavorites, this.uid);
      this.saveScopedArray(LASTITEMS_KEY, slicedLast, this.uid);
    } catch (e) {
      // ignore sync errors
    }
  }

  async saveFavorites(keys: string[]) {
    this.saveScopedArray(FAVORITES_KEY, keys, this.uid);
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
    const sliced = items.slice(0, 50);
    this.saveScopedArray(LASTITEMS_KEY, sliced, this.uid);
    if (!this.uid) return;
    try {
      const db = getFirestore();
      const ref = doc(db, 'users', this.uid);
      await setDoc(ref, { lastItems: sliced }, { merge: true });
    } catch (e) {
      // ignore
    }
  }
}

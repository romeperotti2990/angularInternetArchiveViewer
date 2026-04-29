import { Injectable } from '@angular/core';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';

const FAVORITES_KEY = 'iav:favorites';
const LASTITEMS_KEY = 'iav:lastItems';
const ANONYMOUS_SCOPE = 'anonymous';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private uid: string | null = null;
  private isInitializing: boolean = true;

  constructor(private auth: AuthService) {
    // react to auth state changes
    try {
      this.auth.user$.subscribe((u: any) => {
        this.isInitializing = false;
        this.onAuthChanged(u);
        // Explicitly notify components on every auth state change to prevent flashes
        window.dispatchEvent(new CustomEvent('iav:lastItemsUpdated'));
      });
    } catch (e) {
      this.isInitializing = false;
    }
  }

  private async onAuthChanged(user: any) {
    this.uid = user && user.uid ? user.uid : null;
    
    // Check if the user is a guest (anonymous)
    const isGuest = user && user.isAnonymous;

    // Only sync to Firebase if we have a UID and they are NOT a guest.
    // This keeps guest data stored purely in LocalStorage.
    if (this.uid && !isGuest) {
      await this.syncLocalToRemote();
      // Notify again after sync completes to show merged/remote data
      window.dispatchEvent(new CustomEvent('iav:lastItemsUpdated'));
    }
  }

  getCurrentUserId(): string | null {
    return this.uid;
  }

  private scopeKey(baseKey: string, uid: string | null = this.uid): string {
    return `${baseKey}:${uid || ANONYMOUS_SCOPE}`;
  }

  private loadScopedArray<T>(baseKey: string, uid: string | null = this.uid): T[] {
    // Determine which storage to check. 
    // If a specific UID was requested, use it. Otherwise, use current login state.
    const effectiveUid = uid || this.uid || ANONYMOUS_SCOPE;

    try {
      const raw = localStorage.getItem(`${baseKey}:${effectiveUid}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  private saveScopedArray(baseKey: string, value: any[], uid: string | null = this.uid) {
    const effectiveUid = uid || this.uid || ANONYMOUS_SCOPE;
    try {
      localStorage.setItem(`${baseKey}:${effectiveUid}`, JSON.stringify(value));
    } catch (e) {
      // ignore storage errors
    }
  }

  loadFavorites(): string[] {
    // If the auth system is still initializing, return nothing.
    // This prevents "flashing" Guest history/favorites while waiting to see if we have a user.
    if (this.isInitializing) return [];

    // If signed in, only load the user's favorites from LocalStorage.
    // If not signed in, only load the anonymous favorites.
    return this.loadScopedArray<string>(FAVORITES_KEY, this.uid || ANONYMOUS_SCOPE);
  }

  loadLastItems(): any[] {
    // If the auth system is still initializing, return nothing.
    if (this.isInitializing) return [];

    // If signed in, only load the user's history from LocalStorage.
    // If not signed in, only load the anonymous history.
    return this.loadScopedArray<any>(LASTITEMS_KEY, this.uid || ANONYMOUS_SCOPE);
  }

  private async syncLocalToRemote() {
    if (!this.uid) return;
    try {
      const db = getFirestore();
      const ref = doc(db, 'users', this.uid);
      const snap = await getDoc(ref);
      
      // If the document doesn't exist at all, we'll create it with local data
      if (!snap.exists()) {
        const initialFavorites = this.loadScopedArray<string>(FAVORITES_KEY, this.uid);
        const initialLast = this.loadScopedArray<any>(LASTITEMS_KEY, this.uid);
        await setDoc(ref, { favorites: initialFavorites, lastItems: initialLast });
        return;
      }

      const remote = snap.data() as any;

      // FAVORITES MERGE
      const localFavorites = this.loadScopedArray<string>(FAVORITES_KEY, this.uid);
      const remoteFavorites = Array.isArray(remote.favorites) ? remote.favorites : [];
      const mergedFavorites = Array.from(new Set([...remoteFavorites, ...localFavorites]));

      // LAST ITEMS MERGE (History)
      const localLast = this.loadScopedArray<any>(LASTITEMS_KEY, this.uid);
      const remoteLast = Array.isArray(remote.lastItems) ? remote.lastItems : [];
      
      // CRITICAL: Check if local state is empty (just cleared) while remote still has data.
      // If the user just cleared history locally, we MUST trust the local empty state over the remote data.
      // We look at the 'ts' (timestamp) to see if the server has something we actually want.
      
      let finalLastItems: any[] = [];
      const latestLocalTs = localLast.length > 0 ? Math.max(...localLast.map((i: any) => i.ts || 0)) : -1;
      const latestRemoteTs = remoteLast.length > 0 ? Math.max(...remoteLast.map((i: any) => i.ts || 0)) : -1;

      if (localLast.length === 0 && remoteLast.length > 0) {
        // If local is empty but remote is not:
        // Was it just cleared, or is it a new browser?
        // Check if there's a marker in localStorage that says "History was intentionally cleared"
        const wasCleared = localStorage.getItem('iav:history_cleared_marker');
        if (wasCleared) {
          // It was recently cleared, so we overwrite the remote with the empty local state
          finalLastItems = [];
          localStorage.removeItem('iav:history_cleared_marker');
        } else {
          // It's likely a new browser/session, so we adopt the remote history
          finalLastItems = remoteLast;
        }
      } else {
        // Normal merge logic - combine and deduplicate by URL
        const combined = [...localLast, ...remoteLast];
        const seen = new Set<string>();
        const mergedLast: any[] = [];
        for (const it of combined) {
          if (!it || !it.url) continue;
          // Standardize URLs to prevent duplicates with/without trailing slashes or protocols
          const standardUrl = it.url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
          if (!seen.has(standardUrl)) {
            seen.add(standardUrl);
            mergedLast.push(it);
          }
        }
        finalLastItems = mergedLast.slice(0, 50);
      }

      // Persist the decision back to both places
      await setDoc(ref, { favorites: mergedFavorites, lastItems: finalLastItems }, { merge: true });
      this.saveScopedArray(FAVORITES_KEY, mergedFavorites, this.uid);
      this.saveScopedArray(LASTITEMS_KEY, finalLastItems, this.uid);
      
      // Notify components that history has been updated after sync completes
      window.dispatchEvent(new CustomEvent('iav:lastItemsUpdated'));
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
    // Deduplicate items by URL BEFORE saving to prevent growing duplicates
    const seen = new Set<string>();
    const uniqueItems: any[] = [];
    for (const it of items) {
      if (!it || !it.url) continue;
      const standardUrl = it.url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!seen.has(standardUrl)) {
        seen.add(standardUrl);
        uniqueItems.push(it);
      }
    }

    const sliced = uniqueItems.slice(0, 50);
    this.saveScopedArray(LASTITEMS_KEY, sliced, this.uid);

    // If we are clearing the history (saving an empty array), set a marker 
    // so the next sync knows this was an intentional deletion, not a fresh session.
    if (sliced.length === 0) {
      localStorage.setItem('iav:history_cleared_marker', 'true');
    }

    if (!this.uid) return;
    try {
      const db = getFirestore();
      const ref = doc(db, 'users', this.uid);
      // Removed { merge: true } to ensure the document field is COMPLETELY replaced 
      // by the new (potentially empty) array.
      await setDoc(ref, { lastItems: sliced }, { mergeFields: ['lastItems'] });
    } catch (e) {
      console.error('UserDataService: Failed to save history to Firebase', e);
    }
  }
}

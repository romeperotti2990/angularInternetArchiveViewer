import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Observable of the current Firebase user (or null) */
  user$: Observable<User | null> = new Observable((subscriber) => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => subscriber.next(u));
    return { unsubscribe: unsub } as any;
  });

  async signInWithGoogle(): Promise<void> {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async signUpWithEmail(email: string, password: string) {
    const auth = getAuth();
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async signInWithEmail(email: string, password: string) {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, email, password);
  }

  async signOut(): Promise<void> {
    const auth = getAuth();
    await firebaseSignOut(auth);
  }
}

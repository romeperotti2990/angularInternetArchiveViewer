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
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const code = err?.code || err?.error || '';
      let msg = err?.message || String(err);
      if (code) {
        switch (code) {
          case 'auth/user-not-found':
            msg = 'No account found for that email.'; break;
          case 'auth/wrong-password':
            msg = 'Incorrect password.'; break;
          case 'auth/invalid-email':
            msg = 'Invalid email address.'; break;
          case 'auth/too-many-requests':
            msg = 'Too many attempts; try again later.'; break;
          default:
            // keep Firebase message
            break;
        }
      }
      throw new Error(msg);
    }
  }

  async signOut(): Promise<void> {
    const auth = getAuth();
    await firebaseSignOut(auth);
  }

  async deleteAccount(): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      await user.delete();
    }
  }
}

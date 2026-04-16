import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Lightweight stub implementation to avoid requiring `firebase` during
  // early development. Install `firebase` and replace this service when
  // you're ready to enable Google/Firebase auth.

  user$ = new BehaviorSubject<null>(null);

  constructor() {}

  async signInWithGoogle(): Promise<never> {
    const msg = 'Firebase not installed. Install firebase to enable Google sign-in.';
    console.warn(msg);
    return Promise.reject(new Error(msg));
  }

  async signOut(): Promise<void> {
    console.warn('AuthService.signOut called — no-op in stubbed service.');
  }
}

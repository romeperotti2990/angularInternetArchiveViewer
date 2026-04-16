import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface LocalUser {
  email: string;
  displayName?: string;
  password: string; // stored encoded (not secure, local-only)
}

const STORAGE_KEY = 'iav_local_users';
const SESSION_KEY = 'iav_local_session';

@Injectable({ providedIn: 'root' })
export class LocalAuthService {
  private users: Record<string, LocalUser> = {};
  currentUser$ = new BehaviorSubject<LocalUser | null>(null);

  constructor() {
    this.load();
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const u = JSON.parse(session) as LocalUser;
        this.currentUser$.next(u);
      } catch {}
    }
  }

  private load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      this.users = JSON.parse(raw) as Record<string, LocalUser>;
    } catch {
      this.users = {};
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));
  }

  private encodePassword(password: string) {
    return btoa(password);
  }

  async signup(email: string, password: string, displayName?: string) {
    if (!email || !password) throw new Error('Email and password required');
    this.load();
    if (this.users[email]) throw new Error('User already exists');
    const user: LocalUser = { email, displayName, password: this.encodePassword(password) };
    this.users[email] = user;
    this.save();
    this.currentUser$.next(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async login(email: string, password: string) {
    this.load();
    const user = this.users[email];
    if (!user) throw new Error('User not found');
    if (user.password !== this.encodePassword(password)) throw new Error('Invalid password');
    this.currentUser$.next(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async logout() {
    this.currentUser$.next(null);
    localStorage.removeItem(SESSION_KEY);
  }
}

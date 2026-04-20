import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocalAuthService } from '../../services/local-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  error: string | null = null;

  constructor(private auth: AuthService, private local: LocalAuthService, private router: Router) {}

  async signInWithGoogle() {
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigate(['/']);
    } catch (err) {
      console.error('Login error', err);
      this.error = (err as any)?.message || String(err);
    }
  }

  async loginLocal() {
    this.error = null;
    try {
      if (!this.email || !this.password) {
        this.error = 'Email and password required';
        return;
      }
      await this.auth.signInWithEmail(this.email, this.password);
      await this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.message || String(err);
    }
  }

  async continueAsGuest() {
    this.error = null;
    try {
      await this.local.loginAsGuest();
      await this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.message || String(err);
    }
  }
}

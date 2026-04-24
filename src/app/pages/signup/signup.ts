import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocalAuthService } from '../../services/local-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
})
export class Signup {
  email = '';
  password = '';
  confirm = '';
  displayName = '';
  error: string | null = null;
  success = false;

  constructor(private auth: AuthService, private local: LocalAuthService, private router: Router) {}

  async signInWithGoogle() {
    try {
      await this.auth.signInWithGoogle();
    } catch (err) {
      console.error('Signup error', err);
    }
  }

  async signupLocal() {
    this.error = null;
    this.success = false;
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match';
      return;
    }
    try {
      await this.auth.signUpWithEmail(this.email, this.password);
      this.success = true;
      await this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.message || String(err);
    }
  }

  async continueAsGuest() {
    this.error = null;
    try {
      await this.local.loginAsGuest(this.displayName || undefined);
      await this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.message || String(err);
    }
  }
}

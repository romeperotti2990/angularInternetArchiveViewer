import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LocalAuthService } from '../../services/local-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  error: string | null = null;

  constructor(private auth: AuthService, private local: LocalAuthService) {}

  async signInWithGoogle() {
    try {
      await this.auth.signInWithGoogle();
    } catch (err) {
      console.error('Login error', err);
    }
  }

  async loginLocal() {
    this.error = null;
    try {
      await this.local.login(this.email, this.password);
    } catch (err: any) {
      this.error = err?.message || String(err);
    }
  }
}

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserDataService } from '../../services/user-data.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.html',
})
export class ProfilePage {
  constructor(
    public auth: AuthService,
    private userData: UserDataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async deleteAccount() {
    const user = await new Promise<any>((resolve) => {
      const sub = this.auth.user$.subscribe(u => {
        sub.unsubscribe();
        resolve(u);
      });
    });

    if (!user) {
      alert("You are not signed in.");
      return;
    }

    const msg = `Are you SURE you want to delete your account? This will PERMANENTLY delete your favorites and history from our servers. This cannot be undone. Type "DELETE" to confirm.`;
    const confirmation = prompt(msg);

    if (confirmation === 'DELETE') {
      try {
        await this.userData.deleteUserData();
        await this.auth.deleteAccount();
        alert("Account deleted successfully.");
        this.router.navigate(['/']);
      } catch (e: any) {
        if (e.code === 'auth/requires-recent-login') {
          alert("For security reasons, you must have recently signed in to delete your account. Please sign out and sign back in, then try again.");
        } else {
          alert("Failed to delete account: " + (e.message || e));
        }
      }
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
    } catch (e) {}
  }
}

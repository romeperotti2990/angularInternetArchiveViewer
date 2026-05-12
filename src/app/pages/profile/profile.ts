import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserDataService } from '../../services/user-data.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile.html',
})
export class ProfilePage {
  newName: string = '';
  newEmail: string = '';
  newPassword: string = '';
  newPhotoURL: string = '';
  isUploading: boolean = false;

  constructor(
    public auth: AuthService,
    private userData: UserDataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.newName = user.displayName || '';
        this.newEmail = user.email || '';
        this.newPhotoURL = user.photoURL || '';
      }
    });
  }

  async updateProfile() {
    try {
      if (this.newName) await this.auth.updateProfileName(this.newName);
      if (this.newPhotoURL) await this.auth.updateProfileImage(this.newPhotoURL);
      alert("Profile updated successfully!");
    } catch (e: any) {
      alert("Failed to update profile: " + e.message);
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (limit to 1MB for safety, though base64 will increase it)
    if (file.size > 1024 * 1024) {
      alert("File is too large! Please choose an image under 1MB.");
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    this.isUploading = true;
    reader.onload = async (e: any) => {
      try {
        const base64String = e.target.result;
        // Firebase Auth allows photoURL up to ~2KB usually, but some providers/implementations 
        // vary. Actually, Firebase Auth photoURL has a limit. 
        // For larger strings, we might need to compress or warn.
        // Let's try setting it directly first.
        this.newPhotoURL = base64String;
        this.isUploading = false;
        this.cdr.detectChanges();
      } catch (err) {
        alert("Error processing image.");
        this.isUploading = false;
      }
    };
    reader.readAsDataURL(file);
  }

  async updateEmail() {
    try {
      await this.auth.updateEmailAddress(this.newEmail);
      alert("Email updated successfully!");
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        alert("Please sign out and sign back in to change your email.");
      } else {
        alert("Failed to update email: " + e.message);
      }
    }
  }

  async updatePassword() {
    if (!this.newPassword) return;
    try {
      await this.auth.updateUserPassword(this.newPassword);
      alert("Password updated successfully!");
      this.newPassword = '';
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        alert("Please sign out and sign back in to change your password.");
      } else {
        alert("Failed to update password: " + e.message);
      }
    }
  }

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

  async exportData() {
    await this.userData.exportUserData();
  }

  async importData(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.favorites || !data.history) {
          throw new Error("Invalid IAV data format.");
        }

        const confirmMsg = `Are you sure you want to import this data? This will OVERWRITE your current favorites and history. This action cannot be undone.`;
        if (confirm(confirmMsg)) {
          // Save to local storage and sync to remote
          await this.userData.saveFavorites(data.favorites);
          await this.userData.saveLastItems(data.history);
          
          alert("Data imported successfully! The page will now reload to apply changes.");
          window.location.reload();
        }
      } catch (err) {
        alert("Failed to import data: " + (err instanceof Error ? err.message : "Invalid file format"));
      } finally {
        input.value = ''; // Reset input
      }
    };

    reader.readAsText(file);
  }

  async signOut() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
    } catch (e) {}
  }
}

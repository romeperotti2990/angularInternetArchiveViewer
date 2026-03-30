import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(private router: Router) {}

  onSearch(query: string) {
    const q = (query || '').trim();
    console.log('[Navbar] onSearch called with:', q);
    if (!q) return;
    this.router.navigate(['/search'], { queryParams: { q } });
  }
}

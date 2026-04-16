import { Component, signal, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { Navbar } from './components/navbar/navbar';
import { Searchbar } from './components/searchbar/searchbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Searchbar],
  templateUrl: './app.html',
})
export class App implements OnDestroy {
  protected readonly title = signal('IAV');
  protected readonly showHeader = signal(true);

  private sub: any;

  constructor(private router: Router) {
    // set initial visibility
    const url = this.router.url || '/';
    this.showHeader.set(!(url.startsWith('/login') || url.startsWith('/signup')));

    // update on navigation
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const u = this.router.url || '/';
        this.showHeader.set(!(u.startsWith('/login') || u.startsWith('/signup')));
      });
  }

  ngOnDestroy() {
    try { this.sub.unsubscribe(); } catch (e) {}
  }
}

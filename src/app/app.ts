import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Searchbar } from './components/searchbar/searchbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Searchbar],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('IAV');
}

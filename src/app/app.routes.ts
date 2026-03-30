import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { Media } from './pages/media/media';
import { Search } from './pages/search/search';

export const routes: Routes = [
    { path: '', component: HomePage },
    { path: 'search', component: Search },
    { path: 'media', component: Media },
    { path: 'content/:id', component: Media },
];

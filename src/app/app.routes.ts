import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { Media } from './pages/media/media';
import { Search } from './pages/search/search';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { HistoryPage } from './pages/history/history';
import { ProfilePage } from './pages/profile/profile';

export const routes: Routes = [
    { path: '', component: HomePage },
    { path: 'search', component: Search },
    { path: 'media', component: Media },
    { path: 'content/:id', component: Media },
    { path: 'login', component: Login },
    { path: 'signup', component: Signup },
    { path: 'history', component: HistoryPage },
    { path: 'profile', component: ProfilePage },
];

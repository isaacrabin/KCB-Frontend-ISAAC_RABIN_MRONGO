import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path:'',
        pathMatch:'full',
        redirectTo:'login'
    },
    {
        path: 'login',
        loadChildren: () => import('./layouts/auth-layout/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: 'users',
        loadChildren: () => import('./layouts/main-layout/main.routes').then(m => m.MAIN_ROUTES)
    },
    {
        path:'**',
        loadComponent: () => import('./pages/login/login').then(m => m.Login)
    }
];

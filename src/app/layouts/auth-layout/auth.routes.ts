import { Routes } from "@angular/router";
import { AuthLayout } from "./auth-layout";

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        component: AuthLayout,
        children:[
            {
                path: '',
                loadComponent: () => import('../../pages/login/login').then(m => m.Login)
            }
        ]
    }
];

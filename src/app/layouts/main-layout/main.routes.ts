import { Routes } from "@angular/router";
import { MainLayout } from "./main-layout";

export const MAIN_ROUTES: Routes = [
    {
        path: '',
        component: MainLayout,
        children:[
            {
                path: '',
                loadComponent: () => import('../../pages/users/users').then(m => m.Users)
            }
        ]
    }
];

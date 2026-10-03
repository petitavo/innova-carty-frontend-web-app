import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './iam/infrastructure/auth.guard';
import { Layout } from './shared/presentation/components/layout/layout';
import { PageNotFound } from './shared/presentation/pages/page-not-found/page-not-found';

export const routes: Routes = [
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    title: 'Sign in | Innova Carty Console',
    loadComponent: () => import('./iam/presentation/pages/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard | Innova Carty Console',
        loadComponent: () => import('./monitoring/presentation/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'carts',
        title: 'Carts | Innova Carty Console',
        loadComponent: () => import('./monitoring/presentation/pages/cart-list/cart-list').then((m) => m.CartList),
      },
      {
        path: 'carts/:id',
        title: 'Cart detail | Innova Carty Console',
        loadComponent: () => import('./monitoring/presentation/pages/cart-detail/cart-detail').then((m) => m.CartDetail),
      },
      {
        path: 'alerts',
        title: 'Alerts | Innova Carty Console',
        loadComponent: () => import('./monitoring/presentation/pages/alert-list/alert-list').then((m) => m.AlertList),
      },
      {
        path: 'catalog',
        title: 'Catalog | Innova Carty Console',
        loadComponent: () => import('./catalog/presentation/pages/product-catalog/product-catalog').then((m) => m.ProductCatalog),
      },
      { path: '**', component: PageNotFound, title: 'Not found | Innova Carty Console' },
    ],
  },
];

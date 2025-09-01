import { Routes } from '@angular/router';
import { WalletGuard } from './guards/wallet.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [WalletGuard]
  },
  {
    path: 'invoices/new',
    loadComponent: () => import('./pages/new-invoice/new-invoice.component').then(m => m.NewInvoiceComponent),
    canActivate: [WalletGuard]
  },
  {
    path: 'invoices/:id',
    loadComponent: () => import('./pages/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
    canActivate: [WalletGuard]
  },
  {
    path: 'pay/:id',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'i/:id',
    redirectTo: '/pay/:id'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

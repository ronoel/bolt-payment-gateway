import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { GatewayService, ListInvoicesParams, Invoice } from '../../services/gateway.service';
import { ToastService } from '../../services/toast.service';
import { WalletConnectButtonComponent } from '../../components/wallet-connect-button/wallet-connect-button.component';
import { InvoiceTableComponent } from '../../components/invoice-table/invoice-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, WalletConnectButtonComponent, InvoiceTableComponent],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <div class="header-brand">
                <div class="brand-icon">💼</div>
                <div class="brand-text">
                  <h1>Merchant Dashboard</h1>
                  <p>Manage your Bitcoin payment requests</p>
                </div>
              </div>
            </div>
            <div class="header-right">
              <div class="header-actions">
                <app-wallet-connect-button mode="merchant"></app-wallet-connect-button>
                <a routerLink="/invoices/new" class="btn btn-primary">
                  <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span>New Invoice</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main">
        <div class="container">
          <!-- Stats Cards -->
          <section class="stats-section">
            <div class="section-header">
              <h2>Overview</h2>
              <button 
                class="btn btn-ghost btn-sm"
                (click)="refreshInvoices()"
                [disabled]="loading()">
                @if (loading()) {
                  <div class="loading-spinner"></div>
                  <span>Refreshing...</span>
                } @else {
                  <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span>Refresh</span>
                }
              </button>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon total">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats().total }}</div>
                  <div class="stat-label">Total Invoices</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon paid">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats().paid }}</div>
                  <div class="stat-label">Paid</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon pending">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats().pending }}</div>
                  <div class="stat-label">Pending</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon amount">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div class="stat-content">
                  <div class="stat-value">\${{ stats().totalAmount }}</div>
                  <div class="stat-label">Total Amount</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Quick Actions -->
          <section class="quick-actions">
            <div class="section-header">
              <h2>Quick Actions</h2>
              <p class="section-subtitle">Common tasks to manage your payments</p>
            </div>
            <div class="actions-grid">
              <a routerLink="/invoices/new" class="action-card featured">
                <div class="action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <div class="action-content">
                  <h3>Create Invoice</h3>
                  <p>Start a new payment request with POS interface</p>
                  <span class="action-badge">Primary</span>
                </div>
                <div class="action-arrow">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </a>
              <button class="action-card" (click)="refreshInvoices()">
                <div class="action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </div>
                <div class="action-content">
                  <h3>Refresh Data</h3>
                  <p>Update invoice status and recent payments</p>
                </div>
                <div class="action-arrow">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </button>
              <a href="#analytics" class="action-card">
                <div class="action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div class="action-content">
                  <h3>View Analytics</h3>
                  <p>Detailed reports and payment trends</p>
                  <span class="action-badge coming-soon">Coming Soon</span>
                </div>
                <div class="action-arrow">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </a>
            </div>
          </section>

          <!-- Invoices Table -->
          <section class="invoices-section">
            <div class="section-header">
              <div class="header-info">
                <h2>Recent Invoices</h2>
                <p class="section-subtitle">Manage and track your payment requests</p>
              </div>
              <div class="header-actions">
                <a routerLink="/invoices" class="btn btn-ghost btn-sm">
                  <span>View All</span>
                  <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div class="table-container">
              @if (loading()) {
                <div class="loading-state">
                  <div class="loading-content">
                    <div class="loading-spinner large"></div>
                    <h3>Loading invoices...</h3>
                    <p>Please wait while we fetch your latest data</p>
                  </div>
                </div>
              } @else if (error()) {
                <div class="error-state">
                  <div class="error-content">
                    <div class="error-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                    </div>
                    <h3>Failed to load invoices</h3>
                    <p>{{ error() }}</p>
                    <button class="btn btn-primary" (click)="loadInvoices()">
                      <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      <span>Try Again</span>
                    </button>
                  </div>
                </div>
              } @else {
                <app-invoice-table
                  [items]="invoices()"
                  [total]="pagination().total"
                  [limit]="pagination().limit"
                  [offset]="pagination().offset"
                  [filters]="currentFilters"
                  (onFilterChange)="handleFilterChange($event)"
                  (onPageChange)="handlePageChange($event)"
                  (onCopyLink)="handleCopyLink($event)"
                  (onShowQR)="handleShowQR($event)">
                </app-invoice-table>
              }
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: var(--color-neutral-50);
    }

    /* Header */
    .header {
      background: white;
      border-bottom: 1px solid var(--color-neutral-200);
      padding: var(--space-6) 0;
      box-shadow: var(--shadow-sm);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-6);
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .brand-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xl);
      box-shadow: var(--shadow-md);
    }

    .brand-text h1 {
      margin: 0;
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-neutral-900);
      line-height: var(--line-height-tight);
    }

    .brand-text p {
      margin: var(--space-1) 0 0;
      font-size: var(--font-size-sm);
      color: var(--color-neutral-600);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .btn-icon {
      width: 20px;
      height: 20px;
    }

    /* Main */
    .main {
      padding: var(--space-12) 0;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-8);
      gap: var(--space-6);
    }

    .header-info h2,
    .section-header h2 {
      margin: 0;
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-neutral-900);
      line-height: var(--line-height-tight);
    }

    .section-subtitle {
      margin: var(--space-1) 0 0;
      font-size: var(--font-size-sm);
      color: var(--color-neutral-600);
      line-height: var(--line-height-normal);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: var(--space-16);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-6);
    }

    .stat-card {
      background: white;
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-2xl);
      padding: var(--space-8);
      display: flex;
      align-items: center;
      gap: var(--space-6);
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-200);
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon svg {
      width: 28px;
      height: 28px;
      stroke-width: 1.5;
    }

    .stat-icon.total {
      background: var(--color-neutral-100);
      color: var(--color-neutral-600);
    }

    .stat-icon.paid {
      background: var(--color-success-100);
      color: var(--color-success-600);
    }

    .stat-icon.pending {
      background: var(--color-warning-100);
      color: var(--color-warning-600);
    }

    .stat-icon.amount {
      background: var(--color-primary-100);
      color: var(--color-primary-600);
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-neutral-900);
      line-height: var(--line-height-tight);
      margin-bottom: var(--space-1);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--color-neutral-600);
      font-weight: var(--font-weight-medium);
    }

    /* Quick Actions */
    .quick-actions {
      margin-bottom: var(--space-16);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: var(--space-6);
    }

    .action-card {
      background: white;
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-2xl);
      padding: var(--space-8);
      display: flex;
      align-items: center;
      gap: var(--space-6);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
    }

    .action-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      transition: background var(--transition-fast);
    }

    .action-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary-200);
    }

    .action-card:hover::before {
      background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600));
    }

    .action-card.featured {
      border-color: var(--color-primary-200);
      background: linear-gradient(135deg, white 0%, var(--color-primary-50) 100%);
    }

    .action-card.featured::before {
      background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600));
    }

    .action-icon {
      width: 56px;
      height: 56px;
      background: var(--color-neutral-100);
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-neutral-600);
      flex-shrink: 0;
      transition: all var(--transition-fast);
    }

    .action-card.featured .action-icon {
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
      color: white;
      box-shadow: var(--shadow-md);
    }

    .action-icon svg {
      width: 24px;
      height: 24px;
      stroke-width: 1.5;
    }

    .action-content {
      flex: 1;
    }

    .action-content h3 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
      line-height: var(--line-height-tight);
    }

    .action-content p {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-neutral-600);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-normal);
    }

    .action-badge {
      display: inline-block;
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      background: var(--color-primary-100);
      color: var(--color-primary-700);
    }

    .action-badge.coming-soon {
      background: var(--color-neutral-100);
      color: var(--color-neutral-600);
    }

    .action-arrow {
      color: var(--color-neutral-400);
      flex-shrink: 0;
      transition: all var(--transition-fast);
    }

    .action-card:hover .action-arrow {
      color: var(--color-primary-500);
      transform: translateX(2px);
    }

    .action-arrow svg {
      width: 20px;
      height: 20px;
    }

    /* Invoices Section */
    .invoices-section {
      background: white;
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .invoices-section .section-header {
      padding: var(--space-8) var(--space-8) 0;
      margin-bottom: 0;
    }

    .table-container {
      padding: var(--space-8);
      padding-top: var(--space-6);
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: var(--space-20) var(--space-8);
    }

    .loading-content h3 {
      margin: var(--space-6) 0 var(--space-2) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
    }

    .loading-content p {
      margin: 0;
      color: var(--color-neutral-600);
      font-size: var(--font-size-sm);
    }

    .loading-spinner.large {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: var(--space-20) var(--space-8);
    }

    .error-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .error-icon {
      width: 64px;
      height: 64px;
      background: var(--color-error-100);
      color: var(--color-error-600);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-6);
    }

    .error-icon svg {
      width: 32px;
      height: 32px;
    }

    .error-content h3 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
    }

    .error-content p {
      margin: 0 0 var(--space-8) 0;
      color: var(--color-neutral-600);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-normal);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-6);
      }

      .header-brand {
        justify-content: center;
      }

      .header-actions {
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .main {
        padding: var(--space-8) 0;
      }

      .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-4);
      }

      .header-actions {
        justify-content: flex-start;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: var(--space-6);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
      }

      .stat-icon svg {
        width: 24px;
        height: 24px;
      }

      .action-card {
        padding: var(--space-6);
      }

      .action-icon {
        width: 48px;
        height: 48px;
      }

      .action-icon svg {
        width: 20px;
        height: 20px;
      }

      .invoices-section .section-header,
      .table-container {
        padding: var(--space-6);
      }
    }

    @media (max-width: 480px) {
      .header-brand {
        flex-direction: column;
        text-align: center;
        gap: var(--space-3);
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .header-actions .btn {
        width: 100%;
        justify-content: center;
      }

      .action-card {
        flex-direction: column;
        text-align: center;
        gap: var(--space-4);
      }

      .action-arrow {
        transform: rotate(90deg);
      }

      .action-card:hover .action-arrow {
        transform: rotate(90deg) translateY(-2px);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private walletService = inject(WalletService);
  private gatewayService = inject(GatewayService);
  private toastService = inject(ToastService);

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  invoices = signal<Invoice[]>([]);
  stats = signal({
    total: 0,
    paid: 0,
    pending: 0,
    totalAmount: '0.00'
  });
  pagination = signal({
    total: 0,
    limit: 20,
    offset: 0
  });

  currentFilters: ListInvoicesParams = {};

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    const walletAddress = this.walletService.getSTXAddress();
    if (!walletAddress) {
      this.error.set('Wallet not connected');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const params = {
      ...this.currentFilters,
      limit: this.pagination().limit,
      offset: this.pagination().offset
    };

    this.gatewayService.listInvoices(walletAddress, params)
      .subscribe({
        next: (response) => {
          this.invoices.set(response.items);
          this.pagination.set({
            total: response.total,
            limit: response.limit,
            offset: response.offset
          });
          this.updateStats(response.items);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error.message || 'Failed to load invoices');
          this.loading.set(false);
          this.toastService.error('Error', 'Failed to load invoices');
        }
      });
  }

  refreshInvoices() {
    this.loadInvoices();
    this.toastService.info('Refreshing', 'Updating invoice data...');
  }

  handleFilterChange(filters: ListInvoicesParams) {
    this.currentFilters = filters;
    this.pagination.update(p => ({ ...p, offset: 0 }));
    this.loadInvoices();
  }

  handlePageChange(page: { limit: number; offset: number }) {
    this.pagination.set({ ...this.pagination(), ...page });
    this.loadInvoices();
  }

  handleCopyLink(url: string) {
    this.toastService.success('Copied!', 'Checkout link copied to clipboard');
  }

  handleShowQR(url: string) {
    // QR modal is handled in the share panel component
  }

  private updateStats(invoices: Invoice[]) {
    const stats = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid' || i.status === 'settled').length,
      pending: invoices.filter(i => i.status === 'created').length,
      totalAmount: invoices
        .filter(i => i.status === 'paid' || i.status === 'settled')
        .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0)
        .toFixed(2)
    };
    
    this.stats.set(stats);
  }
}

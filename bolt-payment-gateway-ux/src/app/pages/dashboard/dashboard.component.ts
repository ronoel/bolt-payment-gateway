import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
          <div class="header-left">
            <h1>💼 Merchant Dashboard</h1>
            <div class="wallet-info">
              <app-wallet-connect-button mode="merchant"></app-wallet-connect-button>
            </div>
          </div>
          <div class="header-right">
            <a routerLink="/invoices/new" class="new-invoice-btn">
              ➕ New Invoice
            </a>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main">
        <div class="container">
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().total }}</div>
                <div class="stat-label">Total Invoices</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().paid }}</div>
                <div class="stat-label">Paid</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().pending }}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-content">
                <div class="stat-value">\${{ stats().totalAmount }}</div>
                <div class="stat-label">Total Amount</div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <h2>Quick Actions</h2>
            <div class="actions-grid">
              <a routerLink="/invoices/new" class="action-card">
                <div class="action-icon">➕</div>
                <div class="action-content">
                  <h3>Create Invoice</h3>
                  <p>Start a new payment request with POS interface</p>
                </div>
              </a>
              <button class="action-card" (click)="refreshInvoices()">
                <div class="action-icon">🔄</div>
                <div class="action-content">
                  <h3>Refresh Data</h3>
                  <p>Update invoice status and recent payments</p>
                </div>
              </button>
              <a href="#" class="action-card">
                <div class="action-icon">📈</div>
                <div class="action-content">
                  <h3>View Analytics</h3>
                  <p>Detailed reports and payment trends</p>
                </div>
              </a>
            </div>
          </div>

          <!-- Invoices Table -->
          <div class="invoices-section">
            <div class="section-header">
              <h2>Recent Invoices</h2>
              <div class="section-actions">
                <button 
                  class="refresh-btn"
                  (click)="refreshInvoices()"
                  [disabled]="loading()">
                  {{ loading() ? '⏳' : '🔄' }} Refresh
                </button>
              </div>
            </div>

            @if (loading()) {
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading invoices...</p>
              </div>
            } @else if (error()) {
              <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Failed to load invoices</h3>
                <p>{{ error() }}</p>
                <button class="retry-btn" (click)="loadInvoices()">
                  Try Again
                </button>
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
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f9fafb;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Header */
    .header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 20px 0;
    }

    .header .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .header-left h1 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 24px;
      font-weight: 700;
    }

    .new-invoice-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .new-invoice-btn:hover {
      background: #ea580c;
      transform: translateY(-1px);
    }

    /* Main */
    .main {
      padding: 40px 0;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .stat-icon {
      font-size: 32px;
      width: 60px;
      height: 60px;
      background: #f3f4f6;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #111827;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }

    /* Quick Actions */
    .quick-actions {
      margin-bottom: 40px;
    }

    .quick-actions h2 {
      margin: 0 0 20px 0;
      color: #111827;
      font-size: 20px;
      font-weight: 600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .action-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border-color: #f97316;
    }

    .action-icon {
      font-size: 24px;
      width: 48px;
      height: 48px;
      background: #fef3c7;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-content h3 {
      margin: 0 0 4px 0;
      color: #111827;
      font-size: 16px;
      font-weight: 600;
    }

    .action-content p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.4;
    }

    /* Invoices Section */
    .invoices-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #e5e7eb;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-header h2 {
      margin: 0;
      color: #111827;
      font-size: 20px;
      font-weight: 600;
    }

    .refresh-btn {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #f97316;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-state p {
      margin: 0;
      color: #6b7280;
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: 60px 20px;
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .error-state h3 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 18px;
    }

    .error-state p {
      margin: 0 0 24px 0;
      color: #6b7280;
    }

    .retry-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }

    .retry-btn:hover {
      background: #ea580c;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header .container {
        flex-direction: column;
        align-items: stretch;
      }

      .header-left,
      .header-right {
        width: 100%;
        text-align: center;
      }

      .section-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private gatewayService = inject(GatewayService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
      .pipe(takeUntil(this.destroy$))
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

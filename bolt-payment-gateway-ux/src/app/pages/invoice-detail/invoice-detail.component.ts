import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, interval, switchMap, of } from 'rxjs';
import { GatewayService, Invoice } from '../../services/gateway.service';
import { ToastService } from '../../services/toast.service';
import { StatusPillComponent } from '../../components/status-pill/status-pill.component';
import { SharePanelComponent } from '../../components/share-panel/share-panel.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusPillComponent, SharePanelComponent],
  template: `
    <div class="invoice-detail">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="header-left">
            <a routerLink="/dashboard" class="back-btn">
              ← Back to Dashboard
            </a>
            <div class="header-title">
              <h1>📄 Invoice Details</h1>
              @if (invoice()) {
                <div class="invoice-meta">
                  <span class="invoice-id">ID: {{ shortId(invoice()!.invoice_id) }}</span>
                  <app-status-pill [status]="invoice()!.status"></app-status-pill>
                </div>
              }
            </div>
          </div>
          <div class="header-right">
            @if (invoice()) {
              <button 
                class="refresh-btn"
                (click)="manualRefresh()"
                [disabled]="loading()">
                {{ loading() ? '⏳' : '🔄' }} Refresh
              </button>
            }
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main">
        <div class="container">
          @if (loading() && !invoice()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading invoice details...</p>
            </div>
          } @else if (error()) {
            <div class="error-state">
              <div class="error-icon">⚠️</div>
              <h3>Failed to load invoice</h3>
              <p>{{ error() }}</p>
              <button class="retry-btn" (click)="loadInvoice()">
                Try Again
              </button>
            </div>
          } @else if (invoice()) {
            <div class="invoice-content">
              <!-- Status Banner -->
              @if (invoice()!.status === 'expired') {
                <div class="status-banner expired">
                  <div class="banner-content">
                    <span class="banner-icon">⚠️</span>
                    <div class="banner-text">
                      <strong>Invoice Expired</strong>
                      <p>This payment request is no longer valid. Create a new invoice to continue.</p>
                    </div>
                    <a routerLink="/invoices/new" class="banner-action">
                      Create New Invoice
                    </a>
                  </div>
                </div>
              } @else if (invoice()!.status === 'paid') {
                <div class="status-banner paid">
                  <div class="banner-content">
                    <span class="banner-icon">✅</span>
                    <div class="banner-text">
                      <strong>Payment Received!</strong>
                      <p>This invoice has been successfully paid.</p>
                    </div>
                    <button class="banner-action" (click)="markSettled()">
                      Mark Settled
                    </button>
                  </div>
                </div>
              } @else if (invoice()!.status === 'settled') {
                <div class="status-banner settled">
                  <div class="banner-content">
                    <span class="banner-icon">🎉</span>
                    <div class="banner-text">
                      <strong>Payment Settled</strong>
                      <p>This transaction has been completed and settled.</p>
                    </div>
                  </div>
                </div>
              }

              <div class="invoice-grid">
                <!-- Invoice Info -->
                <div class="invoice-info">
                  <div class="info-card">
                    <h2>Payment Request</h2>
                    <div class="amount-display">
                      <span class="amount">{{ formatAmount(invoice()!.amount) }}</span>
                      <span class="currency">{{ invoice()!.settlement_asset }}</span>
                    </div>
                    
                    @if (invoice()!.merchant_order_id) {
                      <div class="order-info">
                        <span class="label">Order ID:</span>
                        <span class="value">{{ invoice()!.merchant_order_id }}</span>
                      </div>
                    }

                    <div class="creation-info">
                      <span class="label">Created:</span>
                      <span class="value">{{ formatDateTime(invoice()!.created_at) }}</span>
                    </div>

                    <div class="auto-refresh-status">
                      <span class="refresh-indicator" [class.active]="autoRefresh()">
                        {{ autoRefresh() ? '🔄' : '⏸️' }}
                      </span>
                      <span class="refresh-text">
                        {{ autoRefresh() ? 'Auto-refreshing every 2s' : 'Auto-refresh paused' }}
                      </span>
                      <button 
                        class="toggle-refresh"
                        (click)="toggleAutoRefresh()">
                        {{ autoRefresh() ? 'Pause' : 'Resume' }}
                      </button>
                    </div>
                  </div>

                  <!-- Share Panel -->
                  <app-share-panel
                    [checkout_url]="invoice()!.checkout_url"
                    (onCopyLink)="onCopyLink($event)"
                    (onShowQR)="onShowQR($event)"
                    (onOpenCheckout)="onOpenCheckout($event)">
                  </app-share-panel>
                </div>

                <!-- Live Activity -->
                <div class="live-activity">
                  <div class="activity-card">
                    <h2>Live Activity</h2>
                    
                    <!-- Payment Status -->
                    <div class="payment-section">
                      <h3>Payment Status</h3>
                      <div class="status-timeline">
                        <div class="timeline-item" [class.completed]="true">
                          <div class="timeline-dot"></div>
                          <div class="timeline-content">
                            <strong>Invoice Created</strong>
                            <span>{{ formatTime(invoice()!.created_at) }}</span>
                          </div>
                        </div>
                        
                        <div class="timeline-item" [class.completed]="invoice()!.status === 'paid' || invoice()!.status === 'settled'">
                          <div class="timeline-dot"></div>
                          <div class="timeline-content">
                            <strong>Payment Received</strong>
                            @if (invoice()!.status === 'paid' || invoice()!.status === 'settled') {
                              <span>Payment confirmed</span>
                            } @else {
                              <span>Waiting for payment...</span>
                            }
                          </div>
                        </div>
                        
                        <div class="timeline-item" [class.completed]="invoice()!.status === 'settled'">
                          <div class="timeline-dot"></div>
                          <div class="timeline-content">
                            <strong>Payment Settled</strong>
                            @if (invoice()!.status === 'settled') {
                              <span>Transaction completed</span>
                            } @else {
                              <span>Pending settlement</span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .invoice-detail {
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
      align-items: flex-start;
      gap: 20px;
    }

    .header-left {
      flex: 1;
    }

    .back-btn {
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      width: fit-content;
      margin-bottom: 8px;
      transition: color 0.2s;
    }

    .back-btn:hover {
      color: #f97316;
    }

    .header-title h1 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 24px;
      font-weight: 700;
    }

    .invoice-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .invoice-id {
      font-family: monospace;
      color: #6b7280;
      font-size: 14px;
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

    /* Main */
    .main {
      padding: 40px 0;
    }

    /* Loading/Error States */
    .loading-state,
    .error-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
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

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .retry-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Status Banners */
    .status-banner {
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      border-left: 4px solid;
    }

    .status-banner.expired {
      background: #fef2f2;
      border-left-color: #ef4444;
    }

    .status-banner.paid {
      background: #f0fdf4;
      border-left-color: #10b981;
    }

    .status-banner.settled {
      background: #eff6ff;
      border-left-color: #3b82f6;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .banner-icon {
      font-size: 24px;
    }

    .banner-text {
      flex: 1;
    }

    .banner-text strong {
      display: block;
      color: #111827;
      margin-bottom: 4px;
    }

    .banner-text p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    .banner-action {
      background: white;
      border: 1px solid;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
    }

    .status-banner.expired .banner-action {
      border-color: #ef4444;
      color: #ef4444;
    }

    .status-banner.paid .banner-action {
      border-color: #10b981;
      color: #10b981;
    }

    /* Invoice Grid */
    .invoice-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .info-card,
    .activity-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
    }

    .info-card h2,
    .activity-card h2 {
      margin: 0 0 20px 0;
      color: #111827;
      font-size: 18px;
      font-weight: 600;
    }

    /* Amount Display */
    .amount-display {
      text-align: center;
      margin-bottom: 24px;
      padding: 20px;
      background: #f97316;
      color: white;
      border-radius: 8px;
    }

    .amount {
      display: block;
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
    }

    .currency {
      font-size: 18px;
      opacity: 0.9;
      font-weight: 500;
    }

    /* Info Rows */
    .order-info,
    .creation-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .order-info:last-child,
    .creation-info:last-child {
      border-bottom: none;
    }

    .label {
      color: #6b7280;
      font-weight: 500;
    }

    .value {
      color: #111827;
      font-weight: 600;
    }

    /* Auto Refresh Status */
    .auto-refresh-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      margin-top: 16px;
    }

    .refresh-indicator {
      font-size: 16px;
    }

    .refresh-indicator.active {
      animation: spin 2s linear infinite;
    }

    .refresh-text {
      flex: 1;
      font-size: 12px;
      color: #6b7280;
    }

    .toggle-refresh {
      background: none;
      border: 1px solid #d1d5db;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    /* Payment Timeline */
    .payment-section h3 {
      margin: 0 0 16px 0;
      color: #111827;
      font-size: 16px;
      font-weight: 600;
    }

    .status-timeline {
      position: relative;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
      position: relative;
    }

    .timeline-item:last-child {
      margin-bottom: 0;
    }

    .timeline-item:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 6px;
      top: 20px;
      width: 2px;
      height: calc(100% + 4px);
      background: #e5e7eb;
    }

    .timeline-item.completed::after {
      background: #10b981;
    }

    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #e5e7eb;
      border: 2px solid white;
      margin-top: 4px;
      position: relative;
      z-index: 1;
    }

    .timeline-item.completed .timeline-dot {
      background: #10b981;
    }

    .timeline-content {
      flex: 1;
    }

    .timeline-content strong {
      display: block;
      color: #111827;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .timeline-content span {
      color: #6b7280;
      font-size: 12px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .invoice-grid {
        grid-template-columns: 1fr;
      }

      .header .container {
        flex-direction: column;
        align-items: stretch;
      }

      .header-right {
        align-self: flex-start;
      }

      .amount {
        font-size: 36px;
      }

      .banner-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class InvoiceDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private gatewayService = inject(GatewayService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  invoice = signal<Invoice | null>(null);
  autoRefresh = signal(true);

  private invoiceId = '';

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.invoiceId = params['id'];
      this.loadInvoice();
      this.startAutoRefresh();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInvoice() {
    this.loading.set(true);
    this.error.set(null);

    this.gatewayService.getInvoice(this.invoiceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (invoice) => {
          this.invoice.set(invoice);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error.message || 'Failed to load invoice');
          this.loading.set(false);
        }
      });
  }

  private startAutoRefresh() {
    interval(2000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (this.autoRefresh() && this.invoice()?.status === 'created') {
            return this.gatewayService.getInvoice(this.invoiceId);
          }
          return of(null);
        })
      )
      .subscribe({
        next: (invoice) => {
          if (invoice) {
            const oldStatus = this.invoice()?.status;
            this.invoice.set(invoice);
            
            // Show notification on status change
            if (oldStatus && oldStatus !== invoice.status) {
              if (invoice.status === 'paid') {
                this.toastService.success('Payment Received!', 'The invoice has been paid');
              } else if (invoice.status === 'expired') {
                this.toastService.warning('Invoice Expired', 'This payment request is no longer valid');
              }
            }
            
            // Don't reload quote during refresh
          }
        },
        error: (error) => console.warn('Auto-refresh failed:', error)
      });
  }

  manualRefresh() {
    this.loadInvoice();
    this.toastService.info('Refreshing', 'Updating invoice status...');
  }

  toggleAutoRefresh() {
    this.autoRefresh.set(!this.autoRefresh());
    const status = this.autoRefresh() ? 'enabled' : 'disabled';
    this.toastService.info('Auto-refresh', `Auto-refresh ${status}`);
  }

  markSettled() {
    // This would typically call an API to mark the invoice as settled
    this.toastService.info('Feature Coming Soon', 'Settlement marking will be available in a future update');
  }

  onCopyLink(url: string) {
    this.toastService.success('Copied!', 'Checkout link copied to clipboard');
  }

  onShowQR(url: string) {
    // QR display is handled by the share panel component
  }

  onOpenCheckout(url: string) {
    this.toastService.info('Opening Checkout', 'Checkout page opened in new tab');
  }

  shortId(id: string): string {
    return id.length > 12 ? `${id.slice(0, 12)}...` : id;
  }

  formatAmount(amount: string): string {
    return parseFloat(amount).toFixed(2);
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString();
  }

  formatSats(amount: string): string {
    return parseInt(amount).toLocaleString();
  }

  formatPrice(price: string): string {
    return parseFloat(price).toLocaleString();
  }

  formatSpread(spread: string): string {
    return parseFloat(spread).toFixed(1);
  }
}

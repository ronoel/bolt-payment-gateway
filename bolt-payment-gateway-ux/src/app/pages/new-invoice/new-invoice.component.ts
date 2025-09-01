import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WalletService } from '../../services/wallet.service';
import { GatewayService, Invoice } from '../../services/gateway.service';
import { ToastService } from '../../services/toast.service';
import { AmountInputWithNumpadComponent } from '../../components/amount-input-numpad/amount-input-numpad.component';
import { SharePanelComponent } from '../../components/share-panel/share-panel.component';

@Component({
  selector: 'app-new-invoice',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AmountInputWithNumpadComponent, SharePanelComponent],
  template: `
    <div class="new-invoice">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="header-left">
            <a routerLink="/dashboard" class="back-btn">
              ← Back to Dashboard
            </a>
            <h1>🧾 New Invoice</h1>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main">
        <div class="container">
          @if (!createdInvoice()) {
            <!-- Invoice Creation Form -->
            <div class="invoice-form">
              <div class="form-section">
                <h2>Payment Amount</h2>
                <app-amount-input-numpad
                  [currency]="settlementAsset()"
                  [value]="amount()"
                  (onChange)="onAmountChange($event)"
                  (onCurrencyChange)="onCurrencyChange($event)">
                </app-amount-input-numpad>
              </div>

              <div class="form-section">
                <h2>Order Details (Optional)</h2>
                <div class="form-group">
                  <label for="orderId">Merchant Order ID</label>
                  <input
                    type="text"
                    id="orderId"
                    [(ngModel)]="merchantOrderId"
                    placeholder="e.g., ORDER-123, Table-5, etc."
                    class="form-input"
                    maxlength="100" />
                  <small class="form-hint">
                    Optional reference to help you track this payment
                  </small>
                </div>
              </div>

              <div class="form-actions">
                <button
                  class="create-btn"
                  (click)="createInvoice()"
                  [disabled]="creating() || !isFormValid()">
                  {{ creating() ? 'Creating...' : 'Create Invoice' }}
                </button>
                <a routerLink="/dashboard" class="cancel-btn">
                  Cancel
                </a>
              </div>
            </div>
          } @else {
            <!-- Success State -->
            <div class="success-state">
              <div class="success-content">
                <div class="success-icon">🎉</div>
                <h2>Invoice Created Successfully!</h2>
                <div class="invoice-summary">
                  <div class="summary-item">
                    <span class="label">Amount:</span>
                    <span class="value">{{ formatAmount(createdInvoice()!.amount) }} {{ createdInvoice()!.settlement_asset }}</span>
                  </div>
                  @if (createdInvoice()!.merchant_order_id) {
                    <div class="summary-item">
                      <span class="label">Order ID:</span>
                      <span class="value">{{ createdInvoice()!.merchant_order_id }}</span>
                    </div>
                  }
                  <div class="summary-item">
                    <span class="label">Status:</span>
                    <span class="value status-created">Created</span>
                  </div>
                </div>

                <!-- Share Panel -->
                <app-share-panel
                  [checkout_url]="createdInvoice()!.checkout_url"
                  (onCopyLink)="onCopyLink($event)"
                  (onShowQR)="onShowQR($event)"
                  (onOpenCheckout)="onOpenCheckout($event)">
                </app-share-panel>

                <div class="next-actions">
                  <a 
                    [routerLink]="['/invoices', createdInvoice()!.invoice_id]"
                    class="track-btn">
                    📊 Track Payment
                  </a>
                  <button 
                    class="new-invoice-btn"
                    (click)="createAnother()">
                    ➕ Create Another
                  </button>
                  <a routerLink="/dashboard" class="dashboard-btn">
                    🏠 Dashboard
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .new-invoice {
      min-height: 100vh;
      background: #f9fafb;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Header */
    .header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 20px 0;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .back-btn {
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      width: fit-content;
      transition: color 0.2s;
    }

    .back-btn:hover {
      color: #f97316;
    }

    .header h1 {
      margin: 0;
      color: #111827;
      font-size: 24px;
      font-weight: 700;
    }

    /* Main */
    .main {
      padding: 40px 0;
    }

    /* Invoice Form */
    .invoice-form {
      background: white;
      border-radius: 12px;
      padding: 32px;
      border: 1px solid #e5e7eb;
    }

    .form-section {
      margin-bottom: 40px;
    }

    .form-section:last-child {
      margin-bottom: 0;
    }

    .form-section h2 {
      margin: 0 0 20px 0;
      color: #111827;
      font-size: 18px;
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #374151;
      font-weight: 500;
      font-size: 14px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgb(249 115 22 / 0.1);
    }

    .form-hint {
      display: block;
      margin-top: 4px;
      color: #6b7280;
      font-size: 12px;
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .create-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 160px;
    }

    .create-btn:hover:not(:disabled) {
      background: #ea580c;
      transform: translateY(-1px);
    }

    .create-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
      transform: none;
    }

    .cancel-btn {
      background: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
      padding: 15px 31px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s;
    }

    .cancel-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    /* Success State */
    .success-state {
      background: white;
      border-radius: 12px;
      padding: 40px;
      border: 1px solid #e5e7eb;
      text-align: center;
    }

    .success-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .success-content h2 {
      margin: 0 0 30px 0;
      color: #111827;
      font-size: 28px;
      font-weight: 700;
    }

    .invoice-summary {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      text-align: left;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-item .label {
      color: #6b7280;
      font-weight: 500;
    }

    .summary-item .value {
      color: #111827;
      font-weight: 600;
    }

    .status-created {
      background: #dbeafe;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .next-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 30px;
    }

    .track-btn,
    .new-invoice-btn,
    .dashboard-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      font-size: 14px;
    }

    .track-btn {
      background: #f97316;
      color: white;
    }

    .track-btn:hover {
      background: #ea580c;
    }

    .new-invoice-btn {
      background: #10b981;
      color: white;
    }

    .new-invoice-btn:hover {
      background: #059669;
    }

    .dashboard-btn {
      background: #6b7280;
      color: white;
    }

    .dashboard-btn:hover {
      background: #374151;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .container {
        padding: 0 16px;
      }

      .invoice-form,
      .success-state {
        padding: 24px;
      }

      .form-actions,
      .next-actions {
        flex-direction: column;
      }

      .create-btn,
      .cancel-btn {
        width: 100%;
        text-align: center;
      }
    }
  `]
})
export class NewInvoiceComponent implements OnDestroy {
  private walletService = inject(WalletService);
  private gatewayService = inject(GatewayService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Form state
  amount = signal('0.00');
  settlementAsset = signal<'USD' | 'BRL'>('USD');
  merchantOrderId = '';

  // UI state
  creating = signal(false);
  createdInvoice = signal<Invoice | null>(null);

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAmountChange(newAmount: string) {
    this.amount.set(newAmount);
  }

  onCurrencyChange(currency: 'USD' | 'BRL') {
    this.settlementAsset.set(currency);
  }

  isFormValid(): boolean {
    const amountNum = parseFloat(this.amount());
    return amountNum > 0;
  }

  createInvoice() {
    if (!this.isFormValid()) {
      this.toastService.error('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    const walletAddress = this.walletService.getSTXAddress();
    if (!walletAddress) {
      this.toastService.error('Wallet Error', 'Please connect your wallet first');
      return;
    }

    this.creating.set(true);

    const request = {
      amount: this.amount(),
      settlement_asset: this.settlementAsset(),
      merchant_order_id: this.merchantOrderId.trim() || `BOLT-${Date.now()}`
    };

    this.gatewayService.createInvoice(walletAddress, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (invoice) => {
          this.createdInvoice.set(invoice);
          this.creating.set(false);
          this.toastService.success(
            'Invoice Created!', 
            'Your payment request is ready to share'
          );
        },
        error: (error) => {
          this.creating.set(false);
          this.toastService.error(
            'Creation Failed', 
            error.message || 'Failed to create invoice'
          );
        }
      });
  }

  createAnother() {
    this.createdInvoice.set(null);
    this.amount.set('0.00');
    this.merchantOrderId = '';
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

  formatAmount(amount: string): string {
    return parseFloat(amount).toFixed(2);
  }
}

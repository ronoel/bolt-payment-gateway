import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GatewayService, Invoice, Quote, SubmitPaymentRequest } from '../../services/gateway.service';
import { WalletService } from '../../services/wallet.service';
import { ToastService } from '../../services/toast.service';
import { sBTCTokenService } from '../../services/sbtc-token.service';
import { WalletConnectButtonComponent } from '../../components/wallet-connect-button/wallet-connect-button.component';
import { QuoteCardComponent } from '../../components/quote-card/quote-card.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, WalletConnectButtonComponent, QuoteCardComponent],
  template: `
    <div class="checkout">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="logo">
            <h1>⚡ Bolt Payment</h1>
          </div>
          <div class="header-info">
            @if (invoice()) {
              <span class="merchant-info">
                Payment to {{ getMerchantDisplay() }}
              </span>
            }
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main">
        <div class="container">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading payment details...</p>
            </div>
          } @else if (error()) {
            <div class="error-state">
              <div class="error-icon">❌</div>
              <h3>{{ getErrorTitle() }}</h3>
              <p>{{ error() }}</p>
              @if (errorAction()) {
                <button class="error-action-btn" (click)="handleErrorAction()">
                  {{ errorAction() }}
                </button>
              }
            </div>
          } @else if (invoice()) {
            <div class="checkout-content">
              <!-- Payment completed state -->
              @if (paymentStatus() === 'completed') {
                <div class="success-state">
                  <div class="confetti">🎉</div>
                  <h2>Payment Successful!</h2>
                  <div class="success-details">
                    <div class="amount-paid">
                      {{ formatAmount(invoice()!.amount) }} {{ invoice()!.settlement_asset }}
                    </div>
                    @if (transactionId()) {
                      <div class="tx-info">
                        <span class="label">Transaction ID:</span>
                        <a 
                          [href]="getExplorerUrl(transactionId()!)" 
                          target="_blank" 
                          class="tx-link">
                          {{ shortTxId(transactionId()!) }}
                        </a>
                      </div>
                    }
                  </div>
                  <div class="success-actions">
                    <button class="done-btn" (click)="closePage()">
                      Done
                    </button>
                    <button class="new-payment-btn" (click)="newPayment()">
                      New Payment
                    </button>
                  </div>
                </div>
              }
              
              <!-- Underpayment state -->
              @else if (paymentStatus() === 'underpaid') {
                <div class="underpayment-state">
                  <div class="underpayment-icon">⚠️</div>
                  <h2>Payment Incomplete</h2>
                  <p>You've sent {{ formatSats(paidAmount()) }} sats, but {{ formatSats(remainingAmount()) }} sats are still needed.</p>
                  
                  <div class="payment-summary">
                    <div class="summary-row">
                      <span>Required:</span>
                      <span>{{ formatSats(quote()?.from_amount || '0') }} sats</span>
                    </div>
                    <div class="summary-row">
                      <span>Paid:</span>
                      <span>{{ formatSats(paidAmount()) }} sats</span>
                    </div>
                    <div class="summary-row remaining">
                      <span>Remaining:</span>
                      <span>{{ formatSats(remainingAmount()) }} sats</span>
                    </div>
                  </div>

                  <button 
                    class="pay-remaining-btn"
                    (click)="payRemaining()"
                    [disabled]="!walletService.isLoggedInSignal() || processing()">
                    Send Remaining {{ formatSats(remainingAmount()) }} sats
                  </button>
                </div>
              }
              
              <!-- Normal payment flow -->
              @else {
                <!-- Invoice expired -->
                @if (invoice()!.status === 'expired') {
                  <div class="expired-state">
                    <div class="expired-icon">⏰</div>
                    <h2>Payment Request Expired</h2>
                    <p>This payment request is no longer valid. Please contact the merchant to create a new payment request.</p>
                    <div class="contact-info">
                      <p>Need help? Contact the merchant at:</p>
                      <span class="merchant-address">{{ getMerchantDisplay() }}</span>
                    </div>
                  </div>
                }
                
                <!-- Already paid -->
                @else if (invoice()!.status === 'paid' || invoice()!.status === 'settled') {
                  <div class="already-paid-state">
                    <div class="paid-icon">✅</div>
                    <h2>Already Paid</h2>
                    <p>This invoice has already been paid successfully.</p>
                    <button class="return-btn" (click)="returnToMerchant()">
                      Return to Merchant
                    </button>
                  </div>
                }
                
                <!-- Active payment flow -->
                @else {
                  <div class="payment-flow">
                    <!-- Amount Section -->
                    <div class="amount-section">
                      <h2>Payment Request</h2>
                      <div class="amount-display">
                        <span class="label">Pay</span>
                        <div class="amount">
                          <span class="value">{{ formatAmount(invoice()!.amount) }}</span>
                          <span class="currency">{{ invoice()!.settlement_asset }}</span>
                        </div>
                      </div>
                      @if (invoice()!.merchant_order_id && invoice()!.merchant_order_id !== invoice()!.invoice_id) {
                        <div class="order-ref">
                          <span class="label">Order:</span>
                          <span class="value">{{ invoice()!.merchant_order_id }}</span>
                        </div>
                      }
                    </div>

                    <!-- Quote Section -->
                    @if (quote()) {
                      <app-quote-card
                        [quote]="quote()!"
                        (onRefresh)="refreshQuote()">
                      </app-quote-card>
                    } @else {
                      <div class="quote-loading">
                        <div class="spinner small"></div>
                        <p>Getting current exchange rate...</p>
                      </div>
                    }

                    <!-- Wallet Section -->
                    <div class="wallet-section">
                      @if (!walletService.isLoggedInSignal()) {
                        <div class="connect-prompt">
                          <h3>Connect Wallet to Pay</h3>
                          <p>Connect your Bitcoin wallet to complete this payment.</p>
                          <app-wallet-connect-button
                            mode="payer"
                            (onConnected)="onWalletConnected($event)"
                            (onError)="onWalletError($event)">
                          </app-wallet-connect-button>
                        </div>
                      } @else {
                        <div class="payment-ready">
                          <div class="wallet-connected">
                            <span class="wallet-icon">👛</span>
                            <span class="wallet-address">{{ getShortAddress() }}</span>
                            <span class="connected-badge">Connected</span>
                          </div>
                          
                          @if (paymentStatus() === 'processing') {
                            <div class="payment-processing">
                              <div class="spinner"></div>
                              <h3>Processing Payment</h3>
                              <p>Awaiting network confirmation...</p>
                              @if (transactionId()) {
                                <div class="tx-status">
                                  <span class="label">Transaction ID:</span>
                                  <a 
                                    [href]="getExplorerUrl(transactionId()!)" 
                                    target="_blank" 
                                    class="tx-link">
                                    {{ shortTxId(transactionId()!) }}
                                  </a>
                                </div>
                              }
                            </div>
                          } @else {
                            <button 
                              class="pay-btn"
                              (click)="initiatePayment()"
                              [disabled]="!quote() || processing()">
                              💰 Pay with sBTC
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <p>Powered by Bolt Payment Gateway</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .checkout {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Header */
    .header {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding: 20px 0;
    }

    .header .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo h1 {
      margin: 0;
      color: white;
      font-size: 24px;
      font-weight: 700;
    }

    .merchant-info {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }

    /* Main */
    .main {
      flex: 1;
      padding: 40px 0;
    }

    /* Loading/Error States */
    .loading-state,
    .error-state {
      background: white;
      border-radius: 12px;
      padding: 60px 20px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
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

    .spinner.small {
      width: 24px;
      height: 24px;
      border-width: 3px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .error-action-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
    }

    /* Success State */
    .success-state {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .confetti {
      font-size: 64px;
      margin-bottom: 20px;
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }

    .success-state h2 {
      margin: 0 0 20px 0;
      color: #111827;
      font-size: 28px;
      font-weight: 700;
    }

    .amount-paid {
      font-size: 32px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 16px;
    }

    .tx-info {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
    }

    .tx-link {
      color: #f97316;
      text-decoration: none;
      font-family: monospace;
      font-weight: 600;
    }

    .success-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .done-btn,
    .new-payment-btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }

    .done-btn {
      background: #10b981;
      color: white;
    }

    .new-payment-btn {
      background: #f3f4f6;
      color: #374151;
    }

    /* Payment Flow */
    .payment-flow {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .amount-section {
      padding: 32px;
      border-bottom: 1px solid #f3f4f6;
      text-align: center;
    }

    .amount-section h2 {
      margin: 0 0 20px 0;
      color: #111827;
      font-size: 20px;
      font-weight: 600;
    }

    .amount-display .label {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 8px;
      display: block;
    }

    .amount {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
    }

    .amount .value {
      font-size: 48px;
      font-weight: 700;
      color: #111827;
    }

    .amount .currency {
      font-size: 24px;
      color: #6b7280;
      font-weight: 600;
    }

    .order-ref {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .order-ref .label {
      color: #6b7280;
    }

    .order-ref .value {
      color: #111827;
      font-weight: 600;
    }

    /* Quote Loading */
    .quote-loading {
      padding: 32px;
      text-align: center;
      border-bottom: 1px solid #f3f4f6;
    }

    .quote-loading p {
      margin: 16px 0 0 0;
      color: #6b7280;
    }

    /* Wallet Section */
    .wallet-section {
      padding: 32px;
    }

    .connect-prompt {
      text-align: center;
    }

    .connect-prompt h3 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 18px;
    }

    .connect-prompt p {
      margin: 0 0 24px 0;
      color: #6b7280;
    }

    .wallet-connected {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      margin-bottom: 24px;
      padding: 16px;
      background: #f0fdf4;
      border-radius: 8px;
      border: 1px solid #bbf7d0;
    }

    .wallet-icon {
      font-size: 20px;
    }

    .wallet-address {
      font-family: monospace;
      color: #374151;
    }

    .connected-badge {
      background: #10b981;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .pay-btn {
      width: 100%;
      background: #f97316;
      color: white;
      border: none;
      padding: 16px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pay-btn:hover:not(:disabled) {
      background: #ea580c;
      transform: translateY(-1px);
    }

    .pay-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
      transform: none;
    }

    /* Payment Processing */
    .payment-processing {
      text-align: center;
      padding: 20px;
    }

    .payment-processing h3 {
      margin: 16px 0 8px 0;
      color: #111827;
    }

    .payment-processing p {
      margin: 0 0 16px 0;
      color: #6b7280;
    }

    .tx-status {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
    }

    /* Underpayment State */
    .underpayment-state {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .underpayment-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .underpayment-state h2 {
      margin: 0 0 16px 0;
      color: #111827;
      font-size: 24px;
    }

    .payment-summary {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .summary-row:last-child {
      margin-bottom: 0;
    }

    .summary-row.remaining {
      font-weight: 600;
      color: #f97316;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 8px;
    }

    .pay-remaining-btn {
      background: #f59e0b;
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }

    .pay-remaining-btn:hover:not(:disabled) {
      background: #d97706;
    }

    .pay-remaining-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    /* Other States */
    .expired-state,
    .already-paid-state {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .expired-icon,
    .paid-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .contact-info {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .merchant-address {
      font-family: monospace;
      color: #374151;
      font-weight: 600;
    }

    .return-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
    }

    /* Footer */
    .footer {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 20px 0;
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .amount .value {
        font-size: 36px;
      }

      .amount .currency {
        font-size: 18px;
      }

      .success-actions {
        flex-direction: column;
      }

      .wallet-connected {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gatewayService = inject(GatewayService);
  walletService = inject(WalletService);
  private toastService = inject(ToastService);
  private sbtcService = inject(sBTCTokenService);
  private destroy$ = new Subject<void>();

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  invoice = signal<Invoice | null>(null);
  quote = signal<Quote | null>(null);
  paymentStatus = signal<'idle' | 'processing' | 'completed' | 'underpaid'>('idle');
  processing = signal(false);
  transactionId = signal<string | null>(null);
  paidAmount = signal('0');
  remainingAmount = signal('0');
  errorAction = signal<string | null>(null);

  private invoiceId = '';

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.invoiceId = params['id'];
      this.loadInvoice();
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
          
          // Load quote for active invoices
          if (invoice.status === 'created') {
            this.loadQuote();
          }
        },
        error: (error) => {
          this.handleError(error);
        }
      });
  }

  private loadQuote() {
    const invoice = this.invoice();
    if (!invoice) return;

    this.gatewayService.getQuote({
      from: 'BTC',
      to: invoice.settlement_asset,
      to_amount: invoice.amount
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (quote) => this.quote.set(quote),
      error: (error) => console.warn('Failed to load quote:', error)
    });
  }

  refreshQuote() {
    this.loadQuote();
  }

  onWalletConnected(address: string) {
    this.toastService.success('Wallet Connected', 'Ready to make payment');
  }

  onWalletError(error: any) {
    this.toastService.error('Connection Failed', 'Failed to connect wallet');
  }

  async initiatePayment() {
    if (!this.quote() || !this.walletService.isLoggedInSignal()) {
      return;
    }

    this.processing.set(true);
    this.paymentStatus.set('processing');

    try {
      const quote = this.quote()!;
      const requiredSats = parseInt(quote.from_amount);

      // Check sBTC balance first
      const balance = await this.sbtcService.getBalance().toPromise();
      if (balance && balance < requiredSats) {
        throw new Error(`Insufficient sBTC balance. Required: ${requiredSats} sats, Available: ${balance} sats`);
      }

      // Create and sign the sBTC transfer transaction
      const serializedTx = await this.createSbtcTransaction(requiredSats);
      
      // Submit payment to the gateway API
      const paymentRequest: SubmitPaymentRequest = {
        serialized_transaction: serializedTx,
        asset: 'sBTC',
        amount: quote.from_amount
      };

      this.gatewayService.submitPayment(this.invoiceId, paymentRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => this.handlePaymentResponse(response),
          error: (error) => this.handlePaymentError(error)
        });

    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  private async createSbtcTransaction(amount: number): Promise<string> {
    // TODO: Implement transaction creation logic
    console.warn('createSbtcTransaction not implemented yet');
    return '';
  }

  private async getRecipientAddress(): Promise<string> {
    // In a real implementation, this would come from the invoice or gateway API
    // For now, return a placeholder - this should be the gateway's sBTC address
    return 'SP000000000000000000002Q6VF78'; // Placeholder
  }

  private handlePaymentResponse(response: any) {
    this.processing.set(false);
    
    switch (response.status) {
      case 'confirmed':
        this.paymentStatus.set('completed');
        this.transactionId.set(response.transaction_id || null);
        this.toastService.success('Payment Successful!', 'Your payment has been confirmed');
        // Reload invoice to get updated status
        this.loadInvoice();
        break;
        
      case 'accepted':
        this.transactionId.set(response.payment_id || null);
        this.toastService.info('Payment Submitted', 'Waiting for confirmation...');
        // Start polling for confirmation
        this.pollPaymentStatus();
        break;
        
      case 'rejected':
        this.paymentStatus.set('idle');
        this.toastService.error('Payment Failed', 'Transaction was rejected');
        break;
    }
  }

  private handlePaymentError(error: any) {
    this.processing.set(false);
    
    if (error.statusCode === 412) {
      // Underpayment
      const errorData = error.error;
      this.paidAmount.set(errorData.paid_amount || '0');
      this.remainingAmount.set(errorData.remaining_amount || '0');
      this.paymentStatus.set('underpaid');
      this.toastService.warning('Underpayment', 'Additional payment required');
    } else if (error.statusCode === 409) {
      // Already paid or expired
      this.toastService.error('Payment Error', 'Invoice already paid or expired');
      this.loadInvoice(); // Refresh to show current status
    } else {
      this.paymentStatus.set('idle');
      this.toastService.error('Payment Failed', error.message || 'Failed to process payment');
    }
  }

  private pollPaymentStatus() {
    // Poll every 3 seconds for payment confirmation
    const pollInterval = setInterval(() => {
      this.gatewayService.getInvoice(this.invoiceId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (invoice) => {
            if (invoice.status === 'paid' || invoice.status === 'settled') {
              clearInterval(pollInterval);
              this.paymentStatus.set('completed');
              this.invoice.set(invoice);
              this.toastService.success('Payment Confirmed!', 'Your payment has been confirmed');
            }
          },
          error: () => {
            // Continue polling on error
          }
        });
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  }

  private async simulatePaymentProcess() {
    // Simulate transaction creation and signing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTxId = 'tx_' + Math.random().toString(36).substr(2, 16);
    this.transactionId.set(mockTxId);

    // Simulate API submission
    const mockPaymentRequest: SubmitPaymentRequest = {
      serialized_transaction: 'mock_serialized_tx',
      asset: 'sBTC',
      amount: this.quote()!.from_amount
    };

    // Simulate different outcomes
    const outcomes = ['success', 'underpaid', 'error'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    await new Promise(resolve => setTimeout(resolve, 1500));

    switch (outcome) {
      case 'success':
        this.paymentStatus.set('completed');
        this.processing.set(false);
        this.toastService.success('Payment Successful!', 'Your payment has been confirmed');
        break;
      
      case 'underpaid':
        const requiredSats = parseInt(this.quote()!.from_amount);
        const paidSats = Math.floor(requiredSats * 0.8); // 80% paid
        this.paidAmount.set(paidSats.toString());
        this.remainingAmount.set((requiredSats - paidSats).toString());
        this.paymentStatus.set('underpaid');
        this.processing.set(false);
        this.toastService.warning('Underpayment', 'Additional payment required');
        break;
      
      case 'error':
        this.processing.set(false);
        this.paymentStatus.set('idle');
        this.toastService.error('Payment Failed', 'Transaction was rejected');
        break;
    }
  }

  async payRemaining() {
    const remaining = parseInt(this.remainingAmount());
    if (remaining <= 0) return;

    this.processing.set(true);
    
    try {
      const serializedTx = await this.createSbtcTransaction(remaining);
      
      const paymentRequest: SubmitPaymentRequest = {
        serialized_transaction: serializedTx,
        asset: 'sBTC',
        amount: this.remainingAmount()
      };

      this.gatewayService.submitPayment(this.invoiceId, paymentRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => this.handlePaymentResponse(response),
          error: (error) => this.handlePaymentError(error)
        });

    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  private handleError(error: any) {
    this.loading.set(false);
    
    if (error.statusCode === 404) {
      this.error.set('Payment request not found');
      this.errorAction.set('Return to Merchant');
    } else if (error.statusCode === 409) {
      this.error.set('This payment has already been processed');
      this.errorAction.set('Return to Merchant');
    } else {
      this.error.set(error.message || 'Failed to load payment request');
      this.errorAction.set('Try Again');
    }
  }

  handleErrorAction() {
    const action = this.errorAction();
    if (action === 'Try Again') {
      this.loadInvoice();
    } else if (action === 'Return to Merchant') {
      this.returnToMerchant();
    }
  }

  getErrorTitle(): string {
    if (this.error()?.includes('not found')) {
      return 'Payment Not Found';
    }
    if (this.error()?.includes('already been processed')) {
      return 'Already Processed';
    }
    return 'Payment Error';
  }

  getMerchantDisplay(): string {
    // In a real app, you might get merchant name from API
    // For now, show abbreviated wallet address
    const invoice = this.invoice();
    if (!invoice) return 'Merchant';
    
    // Extract wallet address from checkout URL or use a default
    return 'Merchant';
  }

  getShortAddress(): string {
    const address = this.walletService.getSTXAddress();
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  closePage() {
    window.close();
  }

  newPayment() {
    this.router.navigate(['/']);
  }

  returnToMerchant() {
    // In a real app, you might redirect to merchant website
    this.router.navigate(['/']);
  }

  getExplorerUrl(txId: string): string {
    // Return appropriate explorer URL based on network
    const network = this.walletService.getNetwork();
    if (network === 'testnet') {
      return `https://explorer.stacks.co/txid/${txId}?chain=testnet`;
    }
    return `https://explorer.stacks.co/txid/${txId}`;
  }

  shortTxId(txId: string): string {
    return `${txId.slice(0, 8)}...${txId.slice(-8)}`;
  }

  formatAmount(amount: string): string {
    return parseFloat(amount).toFixed(2);
  }

  formatSats(amount: string): string {
    return parseInt(amount).toLocaleString();
  }
}

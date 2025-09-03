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
            <div class="logo-icon">
              <img src="assets/images/bolt-icon.png" alt="Bolt Payment Gateway" />
            </div>
            <h1>Bolt Payment</h1>
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
                  <div class="success-animation">
                    <div class="checkmark-container">
                      <div class="checkmark-circle">
                        <div class="checkmark">✓</div>
                      </div>
                    </div>
                    <div class="confetti-container">
                      <div class="confetti">🎉</div>
                      <div class="confetti">🎊</div>
                      <div class="confetti">✨</div>
                      <div class="confetti">🎉</div>
                      <div class="confetti">🎊</div>
                    </div>
                  </div>
                  
                  <h2 class="success-title">Payment Confirmed!</h2>
                  <p class="success-subtitle">Your payment has been successfully processed</p>
                  
                  <div class="success-details">
                    <div class="payment-summary-card">
                      <div class="summary-row primary">
                        <span class="label">Amount Paid</span>
                        <span class="value">{{ formatAmount(invoice()!.amount) }} {{ invoice()!.settlement_asset }}</span>
                      </div>
                      @if (quote()) {
                        <div class="summary-row">
                          <span class="label">Paid with</span>
                          <span class="value">{{ formatSats(quote()!.from_amount) }} sats</span>
                        </div>
                      }
                      @if (transactionId()) {
                        <div class="summary-row">
                          <span class="label">Transaction ID</span>
                          <div class="tx-display">
                            <span class="tx-short">{{ shortTxId(transactionId()!) }}</span>
                            <a 
                              [href]="getExplorerUrl(transactionId()!)" 
                              target="_blank" 
                              class="view-tx-btn"
                              title="View on blockchain explorer">
                              🔗 View
                            </a>
                          </div>
                        </div>
                      }
                      @if (invoice()!.merchant_order_id && invoice()!.merchant_order_id !== invoice()!.invoice_id) {
                        <div class="summary-row">
                          <span class="label">Order Reference</span>
                          <span class="value">{{ invoice()!.merchant_order_id }}</span>
                        </div>
                      }
                    </div>
                  </div>
                  
                  <div class="success-actions">
                    <button class="primary-btn" (click)="closePage()">
                      <span class="btn-icon">✓</span>
                      Done
                    </button>
                    <button class="secondary-btn" (click)="newPayment()">
                      <span class="btn-icon">💰</span>
                      New Payment
                    </button>
                  </div>
                </div>
              }
              
              <!-- Payment rejected state -->
              @else if (paymentStatus() === 'rejected') {
                <div class="rejection-state">
                  <div class="rejection-icon">❌</div>
                  <h2>Payment Rejected</h2>
                  <p class="rejection-message">Your payment could not be processed and was rejected by the gateway.</p>
                  <p class="retry-instruction">No funds were debited from your account. You can try again with an updated quote.</p>
                  
                  <div class="rejection-details">
                    <div class="detail-row">
                      <span>Attempted Amount:</span>
                      <span>{{ formatSats(quote()?.from_amount || '0') }} sats</span>
                    </div>
                    <div class="detail-row">
                      <span>Payment Status:</span>
                      <span class="status-rejected">Rejected</span>
                    </div>
                  </div>

                  <button 
                    class="retry-payment-btn"
                    (click)="retryPayment()"
                    [disabled]="!walletService.isLoggedInSignal() || processing()">
                    <span class="btn-icon">🔄</span>
                    Try Payment Again
                  </button>
                </div>
              }
              
              <!-- Payment already exists state -->
              @else if (paymentStatus() === 'already_paid') {
                <div class="already-paid-info-state">
                  <div class="already-paid-icon">ℹ️</div>
                  <h2>Payment Already Processed</h2>
                  <p class="already-paid-message">This payment has already been completed or is currently being processed.</p>
                  <p class="already-paid-instruction">No additional action is required from your side.</p>
                  
                  <div class="already-paid-details">
                    <div class="detail-row">
                      <span>Invoice Amount:</span>
                      <span>{{ formatAmount(invoice()!.amount) }} {{ invoice()!.settlement_asset }}</span>
                    </div>
                    <div class="detail-row">
                      <span>Payment Status:</span>
                      <span class="status-already-paid">Already Processed</span>
                    </div>
                    @if (invoice()!.merchant_order_id && invoice()!.merchant_order_id !== invoice()!.invoice_id) {
                      <div class="detail-row">
                        <span>Order Reference:</span>
                        <span>{{ invoice()!.merchant_order_id }}</span>
                      </div>
                    }
                  </div>

                  <div class="already-paid-actions">
                    <button class="return-btn" (click)="returnToMerchant()">
                      <span class="btn-icon">🏠</span>
                      Return to Merchant
                    </button>
                    <button class="new-payment-btn-alt" (click)="newPayment()">
                      <span class="btn-icon">💰</span>
                      New Payment
                    </button>
                  </div>
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
                        [hideRefreshButton]="true"
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
                            <div class="wallet-info">
                              <span class="wallet-address">{{ getShortAddress() }}</span>
                              <span class="connected-badge">Connected</span>
                            </div>
                            <button 
                              class="disconnect-btn"
                              (click)="disconnectWallet()"
                              title="Disconnect wallet">
                              🔌 Disconnect
                            </button>
                          </div>

                          <!-- Wallet Balance Display -->
                          <div class="balance-section">
                            <div class="balance-header">
                              <h4>Wallet Balance</h4>
                              <button 
                                class="refresh-balance-btn"
                                (click)="checkBalance()"
                                [disabled]="balanceLoading()"
                                title="Refresh balance">
                                @if (balanceLoading()) {
                                  ⏳
                                } @else {
                                  🔄
                                }
                              </button>
                            </div>
                            <div class="balance-info">
                              @if (balanceLoading()) {
                                <div class="balance-loading">
                                  <div class="spinner small"></div>
                                  <span>Loading balance...</span>
                                </div>
                              } @else {
                                <div class="balance-display">
                                  <div class="balance-row">
                                    <span class="balance-label">sBTC Balance:</span>
                                    <span class="balance-value">{{ getBalanceDisplaySats() }} sats</span>
                                  </div>
                                  @if (quote()) {
                                    <div class="balance-row">
                                      <span class="balance-label">Required:</span>
                                      <span class="balance-value required">{{ formatSats(quote()!.from_amount) }} sats</span>
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                          </div>

                          <!-- Insufficient Balance Warning -->
                          @if (hasInsufficientBalance()) {
                            <div class="insufficient-balance-warning">
                              <div class="warning-icon">⚠️</div>
                              <div class="warning-content">
                                <h4>Insufficient Balance</h4>
                                <p>You need {{ formatSats(quote()!.from_amount) }} sats but only have {{ getBalanceDisplaySats() }} sats available.</p>
                                <p>Transfer your sBTC to Bolt Wallet to complete this payment.</p>
                                <a 
                                  href="https://boltproto.org/wallet" 
                                  target="_blank" 
                                  class="bolt-wallet-link">
                                  Open Bolt Wallet →
                                </a>
                              </div>
                            </div>
                          }
                          
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
                              [disabled]="!quote() || processing() || hasInsufficientBalance() || balanceLoading()">
                              @if (hasInsufficientBalance()) {
                                ⚠️ Insufficient Balance
                              } @else if (balanceLoading()) {
                                ⏳ Checking Balance...
                              } @else {
                                Pay with sBTC
                              }
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

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-icon img {
      width: 32px;
      height: 32px;
      object-fit: contain;
      filter: brightness(0) invert(1);
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
      border-radius: 16px;
      padding: 48px 32px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
    }

    .success-animation {
      position: relative;
      margin-bottom: 32px;
    }

    .checkmark-container {
      display: inline-block;
      position: relative;
    }

    .checkmark-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
      animation: checkmarkPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .checkmark {
      color: white;
      font-size: 36px;
      font-weight: bold;
      animation: checkmarkDraw 0.4s ease-in-out 0.2s both;
    }

    @keyframes checkmarkPop {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes checkmarkDraw {
      0% { opacity: 0; transform: scale(0); }
      100% { opacity: 1; transform: scale(1); }
    }

    .confetti-container {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      height: 200px;
      pointer-events: none;
    }

    .confetti {
      position: absolute;
      font-size: 24px;
      animation: confettiFall 2s ease-in-out infinite;
    }

    .confetti:nth-child(1) { left: 20%; animation-delay: 0s; }
    .confetti:nth-child(2) { left: 40%; animation-delay: 0.2s; }
    .confetti:nth-child(3) { left: 60%; animation-delay: 0.4s; }
    .confetti:nth-child(4) { left: 80%; animation-delay: 0.6s; }
    .confetti:nth-child(5) { left: 30%; animation-delay: 0.8s; }

    @keyframes confettiFall {
      0% { 
        opacity: 1; 
        transform: translateY(-20px) rotate(0deg);
      }
      50% { 
        opacity: 0.8; 
        transform: translateY(60px) rotate(180deg);
      }
      100% { 
        opacity: 0; 
        transform: translateY(120px) rotate(360deg);
      }
    }

    .success-title {
      color: #111827;
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, #10b981, #059669);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .success-subtitle {
      color: #6b7280;
      font-size: 16px;
      margin: 0 0 32px 0;
    }

    .payment-summary-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .summary-row:last-child {
      margin-bottom: 0;
    }

    .summary-row.primary {
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
    }

    .summary-row.primary .label {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }

    .summary-row.primary .value {
      font-size: 24px;
      font-weight: 700;
      color: #10b981;
    }

    .summary-row .label {
      color: #6b7280;
      font-size: 14px;
    }

    .summary-row .value {
      color: #111827;
      font-weight: 600;
      font-family: monospace;
    }

    .tx-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tx-short {
      font-family: monospace;
      color: #6b7280;
      font-size: 13px;
    }

    .view-tx-btn {
      background: #f3f4f6;
      color: #374151;
      text-decoration: none;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .view-tx-btn:hover {
      background: #e5e7eb;
      color: #111827;
    }

    .success-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 32px;
    }

    .primary-btn,
    .secondary-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      min-width: 140px;
      justify-content: center;
    }

    .primary-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3);
    }

    .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px 0 rgba(16, 185, 129, 0.4);
    }

    .secondary-btn {
      background: #f9fafb;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .secondary-btn:hover {
      background: #f3f4f6;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
    }

    .btn-icon {
      font-size: 18px;
    }

    /* Rejection State */
    .rejection-state {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      border: 2px solid #fecaca;
    }

    .rejection-icon {
      font-size: 64px;
      margin-bottom: 20px;
      animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .rejection-state h2 {
      color: #dc2626;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 16px 0;
    }

    .rejection-message {
      color: #7f1d1d;
      font-size: 16px;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }

    .retry-instruction {
      color: #6b7280;
      font-size: 14px;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .rejection-details {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-row span:first-child {
      color: #6b7280;
      font-size: 14px;
    }

    .detail-row span:last-child {
      color: #111827;
      font-weight: 600;
      font-family: monospace;
    }

    .status-rejected {
      color: #dc2626 !important;
      background: #fecaca;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .retry-payment-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      margin: 0 auto;
    }

    .retry-payment-btn:hover:not(:disabled) {
      background: #ea580c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px 0 rgba(249, 115, 22, 0.3);
    }

    .retry-payment-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
      transform: none;
    }

    /* Already Paid Info State */
    .already-paid-info-state {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      border: 2px solid #dbeafe;
    }

    .already-paid-icon {
      font-size: 64px;
      margin-bottom: 20px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .already-paid-info-state h2 {
      color: #1d4ed8;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 16px 0;
    }

    .already-paid-message {
      color: #1e40af;
      font-size: 16px;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }

    .already-paid-instruction {
      color: #6b7280;
      font-size: 14px;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .already-paid-details {
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }

    .status-already-paid {
      color: #1d4ed8 !important;
      background: #dbeafe;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .already-paid-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 32px;
    }

    .return-btn,
    .new-payment-btn-alt {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      min-width: 140px;
      justify-content: center;
    }

    .return-btn {
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      color: white;
      box-shadow: 0 4px 14px 0 rgba(29, 78, 216, 0.3);
    }

    .return-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px 0 rgba(29, 78, 216, 0.4);
    }

    .new-payment-btn-alt {
      background: #f9fafb;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .new-payment-btn-alt:hover {
      background: #f3f4f6;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
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

    /* QR Code Section */
    .qr-section {
      padding: 32px;
      text-align: center;
      background: white;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .qr-section h3 {
      margin: 0 0 24px 0;
      color: #374151;
      font-size: 20px;
      font-weight: 600;
    }

    .qr-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      border: 2px dashed #d1d5db;
    }

    .qr-code {
      border-radius: 8px;
    }

    .qr-info {
      text-align: center;
    }

    .checkout-url {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 0 0 12px 0;
      word-break: break-all;
    }

    .qr-instructions {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
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
      justify-content: space-between;
      margin-bottom: 24px;
      padding: 16px;
      background: #f0fdf4;
      border-radius: 8px;
      border: 1px solid #bbf7d0;
    }

    .wallet-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .wallet-icon {
      font-size: 20px;
    }

    .wallet-address {
      font-family: monospace;
      color: #374151;
    }

    .disconnect-btn {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .disconnect-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      transform: translateY(-1px);
    }

    .connected-badge {
      background: #10b981;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Balance Section */
    .balance-section {
      margin: 20px 0;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .balance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .balance-section h4 {
      margin: 0;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
    }

    .refresh-balance-btn {
      background: none;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
      color: #6b7280;
      transition: all 0.2s;
    }

    .refresh-balance-btn:hover:not(:disabled) {
      border-color: #9ca3af;
      color: #374151;
    }

    .refresh-balance-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .balance-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 14px;
    }

    .balance-display {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .balance-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .balance-label {
      color: #6b7280;
      font-size: 14px;
    }

    .balance-value {
      font-family: monospace;
      font-weight: 600;
      color: #111827;
    }

    .balance-value.required {
      color: #f97316;
    }

    /* Insufficient Balance Warning */
    .insufficient-balance-warning {
      background: #fef3f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      display: flex;
      gap: 12px;
    }

    .warning-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .warning-content h4 {
      margin: 0 0 8px 0;
      color: #dc2626;
      font-size: 16px;
      font-weight: 600;
    }

    .warning-content p {
      margin: 0 0 8px 0;
      color: #7f1d1d;
      font-size: 14px;
      line-height: 1.4;
    }

    .warning-content p:last-of-type {
      margin-bottom: 12px;
    }

    .bolt-wallet-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #dc2626;
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      transition: background-color 0.2s;
    }

    .bolt-wallet-link:hover {
      background: #b91c1c;
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
        gap: 12px;
        align-items: stretch;
      }

      .wallet-info {
        justify-content: center;
      }

      .disconnect-btn {
        align-self: center;
        font-size: 11px;
        padding: 5px 10px;
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
  private quoteRefreshInterval: any = null;

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  invoice = signal<Invoice | null>(null);
  quote = signal<Quote | null>(null);
  paymentStatus = signal<'idle' | 'processing' | 'completed' | 'rejected' | 'already_paid'>('idle');
  processing = signal(false);
  transactionId = signal<string | null>(null);
  errorAction = signal<string | null>(null);
  walletBalance = signal<number | null>(null);
  balanceLoading = signal(false);
  hasInsufficientBalance = signal(false);

  private invoiceId = '';

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.invoiceId = params['id'];
      this.loadInvoice();
    });

    // Check balance when wallet is already connected
    if (this.walletService.isLoggedInSignal()) {
      this.checkBalance();
    }
  }

  ngOnDestroy() {
    // Clear quote refresh interval
    if (this.quoteRefreshInterval) {
      clearInterval(this.quoteRefreshInterval);
    }
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
      next: (quote) => {
        this.quote.set(quote);
        // Check balance sufficiency when quote loads
        this.checkBalanceSufficiency();
        // Start auto-refresh interval if not already running
        this.startQuoteRefresh();
      },
      error: (error) => console.warn('Failed to load quote:', error)
    });
  }

  private startQuoteRefresh() {
    // Clear existing interval if any
    if (this.quoteRefreshInterval) {
      clearInterval(this.quoteRefreshInterval);
    }

    // Set up auto-refresh every 10 seconds
    this.quoteRefreshInterval = setInterval(() => {
      this.refreshQuoteQuietly();
    }, 20000);
  }

  private refreshQuoteQuietly() {
    const invoice = this.invoice();
    if (!invoice) return;

    // Refresh quote silently without user feedback
    this.gatewayService.getQuote({
      from: 'BTC',
      to: invoice.settlement_asset,
      to_amount: invoice.amount
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (quote) => {
        this.quote.set(quote);
        this.checkBalanceSufficiency();
      },
      error: (error) => console.warn('Failed to refresh quote:', error)
    });
  }

  refreshQuote() {
    this.refreshQuoteQuietly();
  }

  onWalletConnected(address: string) {
    this.toastService.success('Wallet Connected', 'Ready to make payment');
    this.checkBalance();
  }

  onWalletError(error: any) {
    this.toastService.error('Connection Failed', 'Failed to connect wallet');
  }

  disconnectWallet() {
    this.walletService.signOut();
    this.walletBalance.set(null);
    this.hasInsufficientBalance.set(false);
    this.paymentStatus.set('idle');
    this.toastService.info('Wallet Disconnected', 'You can reconnect to make a payment');
  }

  async checkBalance() {
    if (!this.walletService.isLoggedInSignal()) {
      return;
    }

    this.balanceLoading.set(true);
    
    try {
      const balance = await this.sbtcService.getBalance().toPromise();
      this.walletBalance.set(balance ? Number(balance) : 0);
      this.checkBalanceSufficiency();
    } catch (error) {
      console.warn('Failed to load wallet balance:', error);
      this.walletBalance.set(0);
    } finally {
      this.balanceLoading.set(false);
    }
  }

  private checkBalanceSufficiency() {
    const balance = this.walletBalance();
    const quote = this.quote();
    
    if (balance !== null && quote) {
      const requiredSats = parseInt(quote.from_amount);
      this.hasInsufficientBalance.set(balance < requiredSats);
    } else {
      this.hasInsufficientBalance.set(false);
    }
  }

  async initiatePayment() {
    if (!this.quote() || !this.walletService.isLoggedInSignal()) {
      return;
    }

    // Double-check balance sufficiency before proceeding
    if (this.hasInsufficientBalance()) {
      this.toastService.error('Insufficient Balance', 'Please add more sBTC to your wallet');
      return;
    }

    this.processing.set(true);
    this.paymentStatus.set('processing');

    try {
      const quote = this.quote()!;
      const requiredSats = parseInt(quote.from_amount);
      const currentBalance = this.walletBalance();

      // Use cached balance for quick check, but refresh if needed
      if (currentBalance === null || currentBalance < requiredSats) {
        await this.checkBalance(); // Refresh balance
        const updatedBalance = this.walletBalance();
        if (updatedBalance === null || updatedBalance < requiredSats) {
          throw new Error(`Insufficient sBTC balance. Required: ${requiredSats} sats, Available: ${updatedBalance || 0} sats`);
        }
      }

      // Submit payment to the gateway API (service handles transaction creation)
      const invoice = this.invoice()!;
      this.gatewayService.submitPayment(invoice, quote.from_amount)
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
        this.transactionId.set(response.tx_id || response.transaction_id || response.payment_id || null);
        this.toastService.success('Payment Successful!', 'Your payment has been confirmed');
        // Reload invoice to get updated status
        this.loadInvoice();
        break;
        
      case 'rejected':
        this.paymentStatus.set('idle');
        this.toastService.error('Payment Rejected', 'Your payment was rejected. Please try again with a new quote.');
        // Refresh quote to get updated rates
        this.refreshQuoteQuietly();
        break;
        
      default:
        // Handle any unexpected status as rejected
        this.paymentStatus.set('idle');
        this.toastService.error('Payment Failed', 'An unexpected error occurred. Please try again.');
        this.refreshQuoteQuietly();
        break;
    }
  }

  private handlePaymentError(error: any) {
    this.processing.set(false);
    
    // Check if the error indicates payment already exists
    if (error.error === 'payment_already_exists' || error.message?.includes('Payment already exists')) {
      this.paymentStatus.set('already_paid');
      // Don't show toast notification - just display on screen
      return;
    }
    
    if (error.statusCode === 412) {
      // Payment rejected - no funds debited, user can try again
      this.paymentStatus.set('rejected');
      this.toastService.warning('Payment Rejected', 'No funds were debited. Please try again.');
      // Refresh quote for retry
      this.refreshQuoteQuietly();
    } else if (error.statusCode === 409) {
      // Already paid or expired
      this.toastService.error('Payment Error', 'Invoice already paid or expired');
      this.loadInvoice(); // Refresh to show current status
    } else {
      this.paymentStatus.set('rejected');
      this.toastService.error('Payment Rejected', error.message || 'Failed to process payment');
      // Refresh quote for retry
      this.refreshQuoteQuietly();
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
    const outcomes = ['success', 'rejected', 'error', 'already_exists'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    await new Promise(resolve => setTimeout(resolve, 1500));

    switch (outcome) {
      case 'success':
        this.paymentStatus.set('completed');
        this.processing.set(false);
        this.toastService.success('Payment Successful!', 'Your payment has been confirmed');
        break;
      
      case 'rejected':
        this.paymentStatus.set('rejected');
        this.processing.set(false);
        this.toastService.warning('Payment Rejected', 'No funds were debited. Please try again.');
        break;

      case 'already_exists':
        // Simulate the payment_already_exists error
        this.handlePaymentError({
          error: 'payment_already_exists',
          message: 'Payment already exists or being processed'
        });
        break;
      
      case 'error':
        this.processing.set(false);
        this.paymentStatus.set('idle');
        this.toastService.error('Payment Failed', 'Transaction was rejected');
        break;
    }
  }

  retryPayment() {
    // Reset to idle state and refresh quote
    this.paymentStatus.set('idle');
    this.refreshQuoteQuietly();
    this.checkBalance();
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

  getBalanceDisplaySats(): string {
    const balance = this.walletBalance();
    if (balance === null) return '---';
    return balance.toLocaleString();
  }

  getRequiredSats(): number {
    const quote = this.quote();
    return quote ? parseInt(quote.from_amount) : 0;
  }

  getBalanceDisplayBTC(): string {
    const balance = this.walletBalance();
    if (balance === null) return '---';
    return (balance / 100000000).toFixed(8);
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

  getPaymentQRData(): string {
    const invoice = this.invoice();
    if (!invoice) return '';
    
    // Generate the checkout URL for this invoice
    const baseUrl = window.location.origin;
    return `${baseUrl}/pay/${invoice.invoice_id}`;
  }

  getPaymentAddress(): string {
    // Return the checkout URL instead of a Bitcoin address
    return this.getPaymentQRData();
  }
}

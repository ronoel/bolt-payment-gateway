import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-wallet-connect-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wallet-connect">
      @if (!walletService.isLoggedInSignal()) {
        <div class="wallet-card">
          <div class="wallet-header">
            <div class="wallet-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
            </div>
            <h3>Connect Wallet</h3>
            <p>Connect your Bitcoin wallet to get started</p>
          </div>
          <button 
            class="btn btn-primary btn-lg connect-btn" 
            (click)="connectWallet()"
            [disabled]="connecting">
            @if (connecting) {
              <div class="loading-spinner"></div>
              <span>Connecting...</span>
            } @else {
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              <span>Connect Wallet</span>
            }
          </button>
          <div class="security-features">
            <div class="feature">
              <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <span>Secure authentication</span>
            </div>
            <div class="feature">
              <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.414-4.414a2 2 0 00-2.828 0L9 12l-2.586-2.586a2 2 0 00-2.828 2.828l4 4a2 2 0 002.828 0l8-8a2 2 0 000-2.828z"></path>
              </svg>
              <span>No personal data required</span>
            </div>
          </div>
        </div>
      } @else {
        <div class="wallet-connected">
          <div class="connected-info">
            <div class="wallet-avatar">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div class="wallet-details">
              <span class="wallet-address">{{ shortAddress() }}</span>
              <span class="badge badge-success network-badge">{{ walletService.getNetwork() }}</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm disconnect-btn" (click)="disconnectWallet()">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span>Disconnect</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .wallet-connect {
      width: 100%;
    }

    .wallet-card {
      background: white;
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-2xl);
      padding: var(--space-8);
      text-align: center;
      max-width: 400px;
      margin: 0 auto;
      box-shadow: var(--shadow-lg);
    }

    .wallet-header {
      margin-bottom: var(--space-8);
    }

    .wallet-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
      border-radius: var(--radius-2xl);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-4);
      color: white;
    }

    .wallet-icon svg {
      width: 32px;
      height: 32px;
    }

    .wallet-header h3 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
    }

    .wallet-header p {
      margin: 0;
      color: var(--color-neutral-600);
      font-size: var(--font-size-sm);
    }

    .connect-btn {
      width: 100%;
      margin-bottom: var(--space-6);
    }

    .btn-icon {
      width: 20px;
      height: 20px;
    }

    .security-features {
      display: flex;
      justify-content: center;
      gap: var(--space-6);
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-neutral-200);
    }

    .feature {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--color-neutral-600);
    }

    .feature-icon {
      width: 16px;
      height: 16px;
      color: var(--color-success-500);
      flex-shrink: 0;
    }

    /* Connected State */
    .wallet-connected {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4);
      background: white;
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
      max-width: 400px;
    }

    .connected-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
    }

    .wallet-avatar {
      width: 40px;
      height: 40px;
      background: var(--color-neutral-100);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-neutral-600);
      flex-shrink: 0;
    }

    .wallet-avatar svg {
      width: 20px;
      height: 20px;
    }

    .wallet-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .wallet-address {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-900);
    }

    .network-badge {
      align-self: flex-start;
    }

    .disconnect-btn {
      flex-shrink: 0;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .wallet-card {
        padding: var(--space-6);
      }

      .security-features {
        flex-direction: column;
        gap: var(--space-3);
        align-items: center;
      }

      .wallet-connected {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-4);
      }

      .connected-info {
        justify-content: center;
      }
    }
  `]
})
export class WalletConnectButtonComponent {
  @Input() mode: 'merchant' | 'payer' = 'merchant';
  @Output() onConnected = new EventEmitter<string>();
  @Output() onError = new EventEmitter<any>();

  walletService = inject(WalletService);
  connecting = false;

  async connectWallet() {
    this.connecting = true;
    try {
      await this.walletService.signIn();
      const address = this.walletService.getSTXAddress();
      if (address) {
        this.onConnected.emit(address);
      }
    } catch (error) {
      this.onError.emit(error);
    } finally {
      this.connecting = false;
    }
  }

  disconnectWallet() {
    this.walletService.signOut();
  }

  shortAddress(): string {
    const address = this.walletService.getSTXAddress();
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

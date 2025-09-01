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
          <button 
            class="connect-btn" 
            (click)="connectWallet()"
            [disabled]="connecting">
            {{ connecting ? 'Connecting...' : 'Connect Wallet' }}
          </button>
          <small class="note">You'll sign a message to authenticate.</small>
        </div>
      } @else {
        <div class="wallet-connected">
          <span class="address">{{ shortAddress() }}</span>
          <span class="network-badge">{{ walletService.getNetwork() }}</span>
          <button class="disconnect-btn" (click)="disconnectWallet()">
            Disconnect
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .wallet-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      max-width: 400px;
      margin: 0 auto;
    }

    .wallet-logos {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .wallet-logos img {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .connect-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-bottom: 12px;
      transition: background-color 0.2s;
    }

    .connect-btn:hover:not(:disabled) {
      background: #ea580c;
    }

    .connect-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .note {
      color: #6b7280;
      font-size: 14px;
    }

    .wallet-connected {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: #f3f4f6;
      border-radius: 8px;
    }

    .address {
      font-family: monospace;
      font-size: 14px;
      color: #374151;
    }

    .network-badge {
      background: #10b981;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .disconnect-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .disconnect-btn:hover {
      background: #dc2626;
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

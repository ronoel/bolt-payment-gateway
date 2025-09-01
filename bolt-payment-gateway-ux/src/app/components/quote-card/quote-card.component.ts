import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote } from '../../services/gateway.service';

@Component({
  selector: 'app-quote-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quote-card" [class.refreshing]="isRefreshing">
      <div class="quote-header">
        <h3>You'll pay</h3>
        <div class="refresh-timer" [class.warning]="countdown <= 5">
          Auto-refresh in {{ countdown }}s
        </div>
      </div>

      <div class="quote-amount">
        <span class="sats-amount">{{ formatSats(quote?.from_amount || '0') }}</span>
        <span class="sats-label">sats</span>
      </div>

      <div class="quote-details">
        <div class="detail-row">
          <span class="label">BTC/USD Rate:</span>
          <span class="value">{{ formatPrice(quote?.unit_price || '0') }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Spread:</span>
          <span class="value">{{ formatSpread(quote?.spread || '0') }}%</span>
        </div>
        <div class="detail-row">
          <span class="label">Updated:</span>
          <span class="value">{{ formatTime(quote?.refreshed_at || '') }}</span>
        </div>
      </div>

      <div class="quote-actions">
        <button 
          class="refresh-btn"
          (click)="manualRefresh()"
          [disabled]="isRefreshing">
          🔄 {{ isRefreshing ? 'Refreshing...' : 'Refresh Now' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .quote-card {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      border-radius: 12px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .quote-card.refreshing {
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .quote-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .quote-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      opacity: 0.9;
    }

    .refresh-timer {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .refresh-timer.warning {
      background: rgba(239, 68, 68, 0.3);
      animation: blink 1s ease-in-out infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .quote-amount {
      text-align: center;
      margin-bottom: 24px;
    }

    .sats-amount {
      display: block;
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .sats-label {
      font-size: 18px;
      opacity: 0.8;
      font-weight: 500;
    }

    .quote-details {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
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

    .label {
      font-size: 14px;
      opacity: 0.8;
    }

    .value {
      font-size: 14px;
      font-weight: 600;
    }

    .quote-actions {
      text-align: center;
    }

    .refresh-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Responsive design */
    @media (max-width: 640px) {
      .quote-card {
        padding: 20px;
      }

      .sats-amount {
        font-size: 36px;
      }

      .quote-header {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
    }
  `]
})
export class QuoteCardComponent implements OnInit, OnDestroy {
  @Input() quote: Quote | null = null;
  @Input() refreshInterval = 15; // seconds
  @Output() onRefresh = new EventEmitter<void>();

  countdown = 15;
  isRefreshing = false;
  private countdownInterval?: number;
  private refreshTimer?: number;

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  private startCountdown() {
    this.countdown = this.refreshInterval;
    this.countdownInterval = window.setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.autoRefresh();
      }
    }, 1000);
  }

  private autoRefresh() {
    this.isRefreshing = true;
    this.onRefresh.emit();
    
    // Reset countdown after a short delay to show refreshing state
    setTimeout(() => {
      this.isRefreshing = false;
      this.restartCountdown();
    }, 1000);
  }

  manualRefresh() {
    if (this.isRefreshing) return;
    
    this.clearTimers();
    this.isRefreshing = true;
    this.onRefresh.emit();
    
    setTimeout(() => {
      this.isRefreshing = false;
      this.restartCountdown();
    }, 1000);
  }

  private restartCountdown() {
    this.clearTimers();
    this.startCountdown();
  }

  private clearTimers() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  formatSats(amount: string): string {
    const num = parseInt(amount);
    return num.toLocaleString();
  }

  formatPrice(price: string): string {
    const num = parseFloat(price);
    return `$${num.toLocaleString()}`;
  }

  formatSpread(spread: string): string {
    const num = parseFloat(spread);
    return num.toFixed(1);
  }

  formatTime(timestamp: string): string {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

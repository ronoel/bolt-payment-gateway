import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-pill" [ngClass]="status">
      {{ statusText }}
    </span>
  `,
  styles: [`
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-pill.created {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .status-pill.paid {
      background: #dcfce7;
      color: #166534;
    }

    .status-pill.expired {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-pill.settled {
      background: #e0e7ff;
      color: #4338ca;
    }
  `]
})
export class StatusPillComponent {
  @Input() status: 'created' | 'paid' | 'expired' | 'settled' = 'created';

  get statusText(): string {
    switch (this.status) {
      case 'created': return 'Created';
      case 'paid': return 'Paid';
      case 'expired': return 'Expired';
      case 'settled': return 'Settled';
      default: return 'Unknown';
    }
  }
}

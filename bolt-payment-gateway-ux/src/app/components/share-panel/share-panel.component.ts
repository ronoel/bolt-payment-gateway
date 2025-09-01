import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="share-panel">
      <div class="share-header">
        <h3>Share Invoice</h3>
        <p class="tip">Leave this open to monitor payment</p>
      </div>

      <div class="share-content">
        <div class="checkout-url">
          <label>Checkout Link</label>
          <div class="url-display">
            <input 
              type="text" 
              [value]="checkout_url" 
              readonly 
              class="url-input"
              #urlInput />
            <button 
              class="copy-btn"
              (click)="copyLink(urlInput)">
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <div class="actions">
          <button class="action-btn primary" (click)="copyLink()">
            📋 Copy Link
          </button>
          <button class="action-btn secondary" (click)="showQR()">
            📱 Show QR
          </button>
          <button class="action-btn secondary" (click)="openCheckout()">
            🔗 Open Checkout
          </button>
        </div>
      </div>

      <!-- QR Modal -->
      @if (showQRModal) {
        <div class="qr-modal" (click)="closeQR()">
          <div class="qr-content" (click)="$event.stopPropagation()">
            <div class="qr-header">
              <h4>Scan to Pay</h4>
              <button class="close-btn" (click)="closeQR()">×</button>
            </div>
            <div class="qr-code">
              <canvas #qrCanvas></canvas>
            </div>
            <div class="qr-url">{{ checkout_url }}</div>
            <div class="qr-actions">
              <button class="download-btn" (click)="downloadQR()">
                Download QR
              </button>
              <button class="print-btn" (click)="printQR()">
                Print QR
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .share-panel {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-top: 24px;
    }

    .share-header {
      margin-bottom: 20px;
    }

    .share-header h3 {
      margin: 0 0 4px 0;
      color: #111827;
      font-size: 18px;
    }

    .tip {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    .checkout-url {
      margin-bottom: 20px;
    }

    .checkout-url label {
      display: block;
      margin-bottom: 8px;
      color: #374151;
      font-weight: 500;
      font-size: 14px;
    }

    .url-display {
      display: flex;
      gap: 8px;
    }

    .url-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      background: #f9fafb;
      color: #6b7280;
      font-family: monospace;
    }

    .copy-btn {
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: #f3f4f6;
    }

    .copy-btn.copied {
      background: #dcfce7;
      color: #166534;
      border-color: #bbf7d0;
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .action-btn.primary {
      background: #f97316;
      color: white;
      border-color: #f97316;
    }

    .action-btn.primary:hover {
      background: #ea580c;
    }

    .action-btn.secondary {
      background: white;
      color: #374151;
    }

    .action-btn.secondary:hover {
      background: #f3f4f6;
    }

    .qr-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .qr-content {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .qr-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .qr-header h4 {
      margin: 0;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #374151;
    }

    .qr-code {
      text-align: center;
      margin-bottom: 16px;
    }

    .qr-code canvas {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .qr-url {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
      margin-bottom: 20px;
      font-family: monospace;
    }

    .qr-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .download-btn,
    .print-btn {
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .download-btn:hover,
    .print-btn:hover {
      background: #f3f4f6;
    }
  `]
})
export class SharePanelComponent {
  @Input() checkout_url = '';
  @Output() onCopyLink = new EventEmitter<string>();
  @Output() onShowQR = new EventEmitter<string>();
  @Output() onOpenCheckout = new EventEmitter<string>();

  showQRModal = false;
  copied = false;

  copyLink(inputElement?: HTMLInputElement) {
    if (inputElement) {
      inputElement.select();
    }
    
    navigator.clipboard.writeText(this.checkout_url).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
      this.onCopyLink.emit(this.checkout_url);
    });
  }

  showQR() {
    this.showQRModal = true;
    this.onShowQR.emit(this.checkout_url);
    // Generate QR code after modal is shown
    setTimeout(() => this.generateQRCode(), 100);
  }

  closeQR() {
    this.showQRModal = false;
  }

  openCheckout() {
    window.open(this.checkout_url, '_blank');
    this.onOpenCheckout.emit(this.checkout_url);
  }

  private generateQRCode() {
    // Simple QR code generation - in a real app, you'd use a QR library
    const canvas = document.querySelector('.qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 200;
        canvas.height = 200;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', 100, 100);
        ctx.fillText('(Use QR library)', 100, 120);
      }
    }
  }

  downloadQR() {
    const canvas = document.querySelector('.qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'invoice-qr.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  }

  printQR() {
    const canvas = document.querySelector('.qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Invoice QR Code</title></head>
            <body style="text-align: center; padding: 20px;">
              <h2>Scan to Pay</h2>
              <img src="${canvas.toDataURL()}" style="border: 1px solid #ccc;" />
              <p style="word-break: break-all; font-family: monospace; font-size: 12px;">${this.checkout_url}</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }
}

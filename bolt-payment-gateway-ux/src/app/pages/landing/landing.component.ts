import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletConnectButtonComponent } from '../../components/wallet-connect-button/wallet-connect-button.component';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, WalletConnectButtonComponent],
  template: `
    <div class="landing">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="logo">
            <h1>⚡ Bolt Payment Gateway</h1>
          </div>
          <nav class="nav">
            @if (walletService.isLoggedInSignal()) {
              <a routerLink="/dashboard" class="nav-link">Dashboard</a>
              <app-wallet-connect-button mode="merchant"></app-wallet-connect-button>
            } @else {
              <button class="nav-btn" (click)="scrollToConnect()">Get Started</button>
            }
          </nav>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              Accept Bitcoin (sBTC) like a card machine
            </h1>
            <p class="hero-subtitle">
              Frictionless point-of-sale payments with instant QR codes, live tracking, and wallet-first authentication.
            </p>
            <div class="hero-actions">
              @if (!walletService.isLoggedInSignal()) {
                <button class="cta-primary" (click)="scrollToConnect()">
                  Open Dashboard
                </button>
              } @else {
                <a routerLink="/dashboard" class="cta-primary">
                  Go to Dashboard
                </a>
              }
              <button class="cta-secondary" (click)="scrollToHowItWorks()">
                How it works
              </button>
            </div>
          </div>
          <div class="hero-visual">
            <div class="mockup-phone">
              <div class="screen">
                <div class="qr-preview">
                  <div class="qr-code"></div>
                  <p>Scan to Pay</p>
                  <div class="amount">153,846 sats</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works" id="how-it-works">
        <div class="container">
          <h2 class="section-title">How it works</h2>
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Create</h3>
                <p>Connect your wallet and create invoices with big buttons and numpad interface.</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Share</h3>
                <p>Get instant QR codes and short links to share with customers.</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Get Paid</h3>
                <p>Track payments in real-time with live quotes and status updates.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Connect Section -->
      <section class="connect-section" id="connect">
        <div class="container">
          @if (!walletService.isLoggedInSignal()) {
            <div class="connect-content">
              <h2>Connect Your Wallet to Get Started</h2>
              <p>Sign in securely with your Bitcoin wallet to access the merchant dashboard.</p>
              <app-wallet-connect-button 
                mode="merchant"
                (onConnected)="onWalletConnected($event)">
              </app-wallet-connect-button>
            </div>
          } @else {
            <div class="connected-content">
              <h2>🎉 You're all set!</h2>
              <p>Your wallet is connected. Ready to start accepting Bitcoin payments?</p>
              <a routerLink="/dashboard" class="cta-primary">
                Go to Dashboard
              </a>
            </div>
          }
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h4>Bolt Payment Gateway</h4>
              <p>Frictionless Bitcoin payments for merchants.</p>
            </div>
            <div class="footer-section">
              <h4>Network</h4>
              <div class="network-toggle">
                <span class="network-badge">{{ walletService.getNetwork() }}</span>
              </div>
            </div>
            <div class="footer-section">
              <h4>Language</h4>
              <select class="language-select">
                <option value="en">English</option>
                <option value="pt-BR">Português (BR)</option>
              </select>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2025 Bolt Payment Gateway. Built for the Bitcoin ecosystem.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Header */
    .header {
      padding: 20px 0;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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

    .nav {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
    }

    .nav-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Hero */
    .hero {
      padding: 80px 0;
      color: white;
    }

    .hero .container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .hero-title {
      font-size: 48px;
      font-weight: 800;
      line-height: 1.1;
      margin: 0 0 20px 0;
    }

    .hero-subtitle {
      font-size: 20px;
      line-height: 1.6;
      margin: 0 0 40px 0;
      opacity: 0.9;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .cta-primary {
      background: #f97316;
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s;
    }

    .cta-primary:hover {
      background: #ea580c;
      transform: translateY(-2px);
    }

    .cta-secondary {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 30px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cta-secondary:hover {
      background: white;
      color: #667eea;
    }

    .mockup-phone {
      background: #1f2937;
      border-radius: 24px;
      padding: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 300px;
      margin: 0 auto;
    }

    .screen {
      background: white;
      border-radius: 16px;
      padding: 40px 20px;
      text-align: center;
    }

    .qr-preview {
      color: #1f2937;
    }

    .qr-code {
      width: 120px;
      height: 120px;
      background: #000;
      margin: 0 auto 16px auto;
      border-radius: 8px;
    }

    .amount {
      font-size: 24px;
      font-weight: 700;
      color: #f97316;
    }

    /* How It Works */
    .how-it-works {
      background: white;
      padding: 80px 0;
    }

    .section-title {
      text-align: center;
      font-size: 36px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 60px 0;
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 40px;
    }

    .step {
      text-align: center;
      padding: 40px 20px;
      border-radius: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }

    .step-number {
      width: 60px;
      height: 60px;
      background: #f97316;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      margin: 0 auto 20px auto;
    }

    .step h3 {
      margin: 0 0 12px 0;
      font-size: 24px;
      color: #1f2937;
    }

    .step p {
      margin: 0;
      color: #6b7280;
      line-height: 1.6;
    }

    /* Connect Section */
    .connect-section {
      background: #f9fafb;
      padding: 80px 0;
      text-align: center;
    }

    .connect-content h2,
    .connected-content h2 {
      font-size: 36px;
      color: #1f2937;
      margin: 0 0 16px 0;
    }

    .connect-content p,
    .connected-content p {
      font-size: 18px;
      color: #6b7280;
      margin: 0 0 40px 0;
    }

    /* Footer */
    .footer {
      background: #1f2937;
      color: white;
      padding: 60px 0 20px 0;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 40px;
      margin-bottom: 40px;
    }

    .footer-section h4 {
      margin: 0 0 16px 0;
      font-size: 18px;
    }

    .footer-section p {
      margin: 0;
      opacity: 0.8;
      line-height: 1.6;
    }

    .network-badge {
      background: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .language-select {
      background: #374151;
      color: white;
      border: 1px solid #4b5563;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .footer-bottom {
      border-top: 1px solid #374151;
      padding-top: 20px;
      text-align: center;
      opacity: 0.6;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero .container {
        grid-template-columns: 1fr;
        gap: 40px;
        text-align: center;
      }

      .hero-title {
        font-size: 36px;
      }

      .hero-subtitle {
        font-size: 18px;
      }

      .hero-actions {
        justify-content: center;
      }

      .header .container {
        flex-direction: column;
        gap: 20px;
      }

      .nav {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class LandingComponent {
  walletService = inject(WalletService);

  scrollToConnect() {
    document.getElementById('connect')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToHowItWorks() {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  }

  onWalletConnected(address: string) {
    // The wallet service will handle navigation
    console.log('Wallet connected:', address);
  }
}

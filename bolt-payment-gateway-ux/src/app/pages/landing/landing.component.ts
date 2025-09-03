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
          <div class="header-content">
            <div class="logo">
              <div class="logo-icon">
                <img src="assets/images/bolt-icon.png" alt="Bolt Payment Gateway" />
              </div>
              <h1 class="logo-text">Bolt Payment Gateway</h1>
            </div>
            <nav class="nav">
              @if (walletService.isLoggedInSignal()) {
                <a routerLink="/dashboard" class="nav-link">Dashboard</a>
                <app-wallet-connect-button mode="merchant"></app-wallet-connect-button>
              } @else {
                <button class="btn btn-ghost btn-sm" (click)="scrollToConnect()">Get Started</button>
              }
            </nav>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-text">
              <div class="hero-badge">
                <span class="badge badge-primary">⚡ Instant Bitcoin Payments</span>
              </div>
              <h1 class="hero-title">
                Set prices in USD, receive in sBTC, guaranteed value
              </h1>
              <p class="hero-subtitle">
                You define prices in USD and receive exactly that value. Your customers pay with Bitcoin and get instant conversion rates. No volatility risk for merchants, best rates for customers.
              </p>
              <div class="hero-actions">
                @if (!walletService.isLoggedInSignal()) {
                  <button class="btn btn-primary btn-lg" (click)="scrollToConnect()">
                    <span>Start Accepting Payments</span>
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                  </button>
                } @else {
                  <a routerLink="/dashboard" class="btn btn-primary btn-lg">
                    <span>Go to Dashboard</span>
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                  </a>
                }
                <button class="btn btn-ghost btn-lg" (click)="scrollToHowItWorks()">
                  <span>How it works</span>
                </button>
              </div>
              <div class="hero-stats">
                <div class="stat">
                  <div class="stat-value">💲</div>
                  <div class="stat-label">USD Pricing</div>
                </div>
                <div class="stat">
                  <div class="stat-value">⚡</div>
                  <div class="stat-label">Instant Conversion</div>
                </div>
                <div class="stat">
                  <div class="stat-value">�️</div>
                  <div class="stat-label">Zero Volatility</div>
                </div>
              </div>
            </div>
            <div class="hero-visual">
              <div class="payment-mockup">
                <div class="mockup-header">
                  <div class="mockup-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div class="mockup-title">Payment Request</div>
                </div>
                <div class="mockup-content">
                  <div class="qr-container">
                    <div class="qr-code">
                      <div class="qr-pattern"></div>
                    </div>
                    <div class="qr-status">
                      <div class="status-indicator active"></div>
                      <span>Ready to Scan</span>
                    </div>
                  </div>
                  <div class="payment-details">
                    <div class="amount-display">
                      <span class="amount">153,846</span>
                      <span class="currency">sats</span>
                    </div>
                    <div class="payment-meta">
                      <span class="payment-id">ID: #4fa2b1</span>
                      <span class="time-remaining">5:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="container">
          <div class="features-header">
            <h2 class="section-title">Everything you need to accept Bitcoin</h2>
            <p class="section-subtitle">Professional-grade payment processing designed for modern businesses</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🚀</div>
              <h3>Lightning Fast</h3>
              <p>Generate payment requests instantly with optimized QR codes and short links.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Real-time Tracking</h3>
              <p>Monitor payments live with automatic status updates and comprehensive analytics.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">�</div>
              <h3>USD Price Guarantee</h3>
              <p>Set prices in USD and receive exactly that value in sBTC. No volatility risk for merchants.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3>Instant Conversion</h3>
              <p>Bolt Protocol enables real-time USD to sBTC conversion at the moment of payment.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">�</div>
              <h3>Best Rates for Customers</h3>
              <p>Customers get optimal exchange rates with instant confirmation through Bolt Protocol.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🛡️</div>
              <h3>Enterprise Security</h3>
              <p>Wallet-based authentication with cryptographic signatures for maximum security.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works" id="how-it-works">
        <div class="container">
          <div class="how-it-works-header">
            <h2 class="section-title">How it works</h2>
            <p class="section-subtitle">Secure USD pricing with Bitcoin payments and instant conversion</p>
          </div>
          <div class="steps">
            <div class="step">
              <div class="step-indicator">
                <div class="step-number">1</div>
                <div class="step-connector"></div>
              </div>
              <div class="step-content">
                <h3>Set USD Price</h3>
                <p>Define your product or service price in USD. The system guarantees you'll receive exactly this value.</p>
                <div class="step-features">
                  <span class="feature-tag">USD Pricing</span>
                  <span class="feature-tag">Zero Volatility Risk</span>
                </div>
              </div>
            </div>
            <div class="step">
              <div class="step-indicator">
                <div class="step-number">2</div>
                <div class="step-connector"></div>
              </div>
              <div class="step-content">
                <h3>Customer Pays in sBTC</h3>
                <p>Customer scans QR code and pays with sBTC. Bolt Protocol immediately confirms the transaction for conversion rate in real-time.</p>
                <div class="step-features">
                  <span class="feature-tag">Instant Rates</span>
                  <span class="feature-tag">QR Payment</span>
                </div>
              </div>
            </div>
            <div class="step">
              <div class="step-indicator">
                <div class="step-number">3</div>
              </div>
              <div class="step-content">
                <h3>Receive Guaranteed USD Value</h3>
                <p>You receive the exact USD value you set, converted from sBTC at the moment of payment. No surprises, no volatility risk.</p>
                <div class="step-features">
                  <span class="feature-tag">Guaranteed Value</span>
                  <span class="feature-tag">Instant Settlement</span>
                </div>
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
              <div class="connect-header">
                <h2>Ready to receive payments in sBTC?</h2>
                <p>Connect your wallet and start accepting Bitcoin payments with zero volatility risk</p>
              </div>
              <div class="connect-card">
                <app-wallet-connect-button 
                  mode="merchant"
                  (onConnected)="onWalletConnected($event)">
                </app-wallet-connect-button>
                <div class="security-note">
                  <svg class="security-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  <span>Secure wallet-based authentication. No personal data required.</span>
                </div>
              </div>
            </div>
          } @else {
            <div class="connected-content">
              <div class="success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2>You're all set!</h2>
              <p>Your wallet is connected. Ready to start setting USD prices and receiving guaranteed value in sBTC?</p>
              <a routerLink="/dashboard" class="btn btn-primary btn-lg">
                <span>Open Dashboard</span>
                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </a>
            </div>
          }
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-main">
              <div class="footer-brand">
                <div class="footer-logo">
                  <div class="logo-icon">
                    <img src="assets/images/bolt-icon.png" alt="Bolt Payment Gateway" />
                  </div>
                  <span>Bolt Payment Gateway</span>
                </div>
                <p>Bitcoin payment processing for modern businesses.</p>
                <div class="social-links">
                  <a href="#" class="social-link" aria-label="GitHub">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a href="#" class="social-link" aria-label="Twitter">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>
              <div class="footer-links">
                <div class="link-group">
                  <h4>Product</h4>
                  <a href="#features" class="footer-link">Features</a>
                  <a href="#how-it-works" class="footer-link">How it works</a>
                  <a href="#" class="footer-link">Pricing</a>
                </div>
                <div class="link-group">
                  <h4>Support</h4>
                  <a href="#" class="footer-link">Documentation</a>
                  <a href="#" class="footer-link">API Reference</a>
                  <a href="#" class="footer-link">Contact</a>
                </div>
                <div class="link-group">
                  <h4>Network</h4>
                  <div class="network-info">
                    <span class="badge badge-success">{{ walletService.getNetwork() }}</span>
                    <select class="network-select">
                      <option value="en">English</option>
                      <option value="pt-BR">Português (BR)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="footer-bottom">
              <p>&copy; 2025 Bolt Payment Gateway. Built for the Stacks ecosystem.</p>
              <div class="footer-legal">
                <a href="#" class="legal-link">Privacy Policy</a>
                <a href="#" class="legal-link">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      position: relative;
      overflow-x: hidden;
    }

    .landing::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100vh;
      background: radial-gradient(circle at 20% 80%, rgba(249, 115, 22, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    /* Header */
    .header {
      position: relative;
      z-index: 10;
      padding: var(--space-6) 0;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

        .logo-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-icon img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }

    .logo-text {
      margin: 0;
      color: white;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      line-height: 1;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: var(--space-6);
    }

    .nav-link {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
      transition: color var(--transition-fast);
    }

    .nav-link:hover {
      color: white;
    }

    /* Hero */
    .hero {
      position: relative;
      z-index: 1;
      padding: var(--space-24) 0;
      color: white;
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-20);
      align-items: center;
    }

    .hero-badge {
      margin-bottom: var(--space-6);
    }

    .hero-title {
      font-size: var(--font-size-6xl);
      font-weight: var(--font-weight-extrabold);
      line-height: var(--line-height-tight);
      margin: 0 0 var(--space-6) 0;
      background: linear-gradient(135deg, white 0%, rgba(255, 255, 255, 0.8) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: var(--font-size-xl);
      line-height: var(--line-height-relaxed);
      margin: 0 0 var(--space-10) 0;
      color: rgba(255, 255, 255, 0.8);
      max-width: 90%;
    }

    .hero-actions {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-12);
    }

    .btn-icon {
      width: 20px;
      height: 20px;
    }

    .hero-stats {
      display: flex;
      gap: var(--space-8);
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: var(--font-size-3xl);
      margin-bottom: var(--space-2);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: rgba(255, 255, 255, 0.7);
      font-weight: var(--font-weight-medium);
    }

    /* Payment Mockup */
    .payment-mockup {
      background: white;
      border-radius: var(--radius-3xl);
      box-shadow: var(--shadow-2xl);
      overflow: hidden;
      max-width: 400px;
      margin: 0 auto;
      transform: rotate(-3deg);
      transition: transform var(--transition-slow);
    }

    .payment-mockup:hover {
      transform: rotate(0deg) scale(1.02);
    }

    .mockup-header {
      background: var(--color-neutral-50);
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-neutral-200);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .mockup-dots {
      display: flex;
      gap: var(--space-2);
    }

    .mockup-dots span {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background: var(--color-neutral-300);
    }

    .mockup-dots span:first-child {
      background: var(--color-error-500);
    }

    .mockup-dots span:nth-child(2) {
      background: var(--color-warning-500);
    }

    .mockup-dots span:last-child {
      background: var(--color-success-500);
    }

    .mockup-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-600);
    }

    .mockup-content {
      padding: var(--space-8);
      text-align: center;
    }

    .qr-container {
      margin-bottom: var(--space-6);
    }

    .qr-code {
      width: 160px;
      height: 160px;
      margin: 0 auto var(--space-4);
      border-radius: var(--radius-xl);
      background: var(--color-neutral-900);
      position: relative;
      overflow: hidden;
    }

    .qr-pattern {
      position: absolute;
      inset: var(--space-4);
      background-image: 
        linear-gradient(45deg, transparent 25%, white 25%, white 75%, transparent 75%),
        linear-gradient(-45deg, transparent 25%, white 25%, white 75%, transparent 75%);
      background-size: 8px 8px;
      background-position: 0 0, 4px 4px;
    }

    .qr-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      color: var(--color-neutral-600);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background: var(--color-neutral-300);
    }

    .status-indicator.active {
      background: var(--color-success-500);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .payment-details {
      border-top: 1px solid var(--color-neutral-200);
      padding-top: var(--space-6);
    }

    .amount-display {
      margin-bottom: var(--space-4);
    }

    .amount {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-600);
    }

    .currency {
      font-size: var(--font-size-lg);
      color: var(--color-neutral-500);
      margin-left: var(--space-2);
    }

    .payment-meta {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
      color: var(--color-neutral-500);
    }

    .payment-id {
      font-family: var(--font-family-mono);
    }

    /* Features Section */
    .features {
      background: white;
      padding: var(--space-24) 0;
      position: relative;
    }

    .features-header {
      text-align: center;
      margin-bottom: var(--space-16);
    }

    .section-title {
      font-size: var(--font-size-5xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-neutral-900);
      margin: 0 0 var(--space-6) 0;
      line-height: var(--line-height-tight);
    }

    .section-subtitle {
      font-size: var(--font-size-xl);
      color: var(--color-neutral-600);
      margin: 0;
      line-height: var(--line-height-relaxed);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: var(--space-8);
    }

    .feature-card {
      text-align: center;
      padding: var(--space-8);
      border-radius: var(--radius-2xl);
      background: var(--color-neutral-50);
      border: 1px solid var(--color-neutral-200);
      transition: all var(--transition-base);
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-xl);
      border-color: var(--color-primary-200);
    }

    .feature-icon {
      font-size: var(--font-size-5xl);
      margin-bottom: var(--space-6);
      display: block;
    }

    .feature-card h3 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
      margin: 0 0 var(--space-4) 0;
    }

    .feature-card p {
      color: var(--color-neutral-600);
      margin: 0;
      line-height: var(--line-height-relaxed);
    }

    /* How It Works */
    .how-it-works {
      background: var(--color-neutral-50);
      padding: var(--space-24) 0;
    }

    .how-it-works-header {
      text-align: center;
      margin-bottom: var(--space-16);
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: var(--space-12);
      max-width: 1200px;
      margin: 0 auto;
    }

    .step {
      display: flex;
      gap: var(--space-6);
      align-items: flex-start;
    }

    .step-indicator {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .step-number {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
      color: white;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      box-shadow: var(--shadow-lg);
    }

    .step-connector {
      width: 2px;
      height: 100px;
      background: linear-gradient(to bottom, var(--color-primary-300), transparent);
      margin-top: var(--space-4);
    }

    .step:last-child .step-connector {
      display: none;
    }

    .step-content h3 {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
      margin: 0 0 var(--space-4) 0;
    }

    .step-content p {
      color: var(--color-neutral-600);
      margin: 0 0 var(--space-4) 0;
      line-height: var(--line-height-relaxed);
    }

    .step-features {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .feature-tag {
      background: var(--color-primary-100);
      color: var(--color-primary-700);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    /* Connect Section */
    .connect-section {
      background: linear-gradient(135deg, var(--color-neutral-900) 0%, var(--color-neutral-800) 100%);
      padding: var(--space-24) 0;
      color: white;
      text-align: center;
    }

    .connect-header {
      margin-bottom: var(--space-12);
    }

    .connect-header h2 {
      font-size: var(--font-size-5xl);
      font-weight: var(--font-weight-bold);
      margin: 0 0 var(--space-6) 0;
      line-height: var(--line-height-tight);
    }

    .connect-header p {
      font-size: var(--font-size-xl);
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      line-height: var(--line-height-relaxed);
    }

    .connect-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-3xl);
      padding: var(--space-12);
      max-width: 500px;
      margin: 0 auto;
    }

    .security-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      margin-top: var(--space-8);
      padding: var(--space-4);
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: var(--radius-xl);
      font-size: var(--font-size-sm);
      color: rgba(255, 255, 255, 0.9);
    }

    .security-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .connected-content {
      max-width: 600px;
      margin: 0 auto;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto var(--space-8);
      background: var(--color-success-500);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-icon svg {
      width: 40px;
      height: 40px;
      stroke-width: 3;
    }

    .connected-content h2 {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      margin: 0 0 var(--space-6) 0;
    }

    .connected-content p {
      font-size: var(--font-size-xl);
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 var(--space-10) 0;
    }

    /* Footer */
    .footer {
      background: var(--color-neutral-900);
      color: white;
      padding: var(--space-24) 0 var(--space-8) 0;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .footer-main {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-16);
      margin-bottom: var(--space-16);
    }

    .footer-brand {
      max-width: 350px;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
    }

    .footer-brand p {
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 var(--space-8) 0;
      line-height: var(--line-height-relaxed);
    }

    .social-links {
      display: flex;
      gap: var(--space-4);
    }

    .social-link {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.7);
      transition: all var(--transition-fast);
    }

    .social-link:hover {
      background: var(--color-primary-500);
      color: white;
      transform: translateY(-2px);
    }

    .social-link svg {
      width: 20px;
      height: 20px;
    }

    .footer-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-12);
    }

    .link-group h4 {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      margin: 0 0 var(--space-6) 0;
    }

    .footer-link {
      display: block;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      margin-bottom: var(--space-3);
      transition: color var(--transition-fast);
    }

    .footer-link:hover {
      color: white;
    }

    .network-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      align-items: flex-start;
    }

    .network-select {
      background: var(--color-neutral-800);
      color: white;
      border: 1px solid var(--color-neutral-700);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      font-size: var(--font-size-sm);
    }

    .footer-bottom {
      border-top: 1px solid var(--color-neutral-800);
      padding-top: var(--space-8);
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: var(--font-size-sm);
    }

    .footer-legal {
      display: flex;
      gap: var(--space-6);
    }

    .legal-link {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .legal-link:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .hero-content {
        grid-template-columns: 1fr;
        text-align: center;
        gap: var(--space-12);
      }

      .hero-title {
        font-size: var(--font-size-5xl);
      }

      .features-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }

      .footer-main {
        grid-template-columns: 1fr;
        gap: var(--space-12);
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }

      .nav {
        justify-content: center;
        width: 100%;
      }

      .hero {
        padding: var(--space-16) 0;
      }

      .hero-title {
        font-size: var(--font-size-4xl);
      }

      .hero-subtitle {
        font-size: var(--font-size-lg);
        max-width: 100%;
      }

      .hero-actions {
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
      }

      .hero-actions .btn {
        width: 100%;
        max-width: 300px;
      }

      .features {
        padding: var(--space-16) 0;
      }

      .how-it-works {
        padding: var(--space-16) 0;
      }

      .steps {
        grid-template-columns: 1fr;
      }

      .step {
        flex-direction: column;
        text-align: center;
      }

      .step-connector {
        width: 100px;
        height: 2px;
        margin: var(--space-4) 0;
      }

      .connect-section {
        padding: var(--space-16) 0;
      }

      .footer {
        padding: var(--space-16) 0 var(--space-6) 0;
      }

      .footer-bottom {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }
    }

    @media (max-width: 480px) {
      .hero-title {
        font-size: var(--font-size-3xl);
      }

      .section-title {
        font-size: var(--font-size-4xl);
      }

      .features-grid,
      .footer-links {
        grid-template-columns: 1fr;
      }

      .payment-mockup {
        max-width: 300px;
        transform: none;
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

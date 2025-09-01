import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-amount-input-numpad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="amount-input-numpad">
      <div class="amount-display">
        <div class="currency-toggle">
          <button 
            type="button"
            [class.active]="currency === 'USD'"
            (click)="changeCurrency('USD')">
            USD
          </button>
          <button 
            type="button"
            [class.active]="currency === 'BRL'"
            (click)="changeCurrency('BRL')">
            BRL
          </button>
        </div>
        
        <div class="amount-value">
          <span class="currency-symbol">{{ currencySymbol }}</span>
          <span class="amount">{{ displayValue }}</span>
        </div>
      </div>

      <div class="numpad">
        <div class="numpad-row">
          <button type="button" (click)="addDigit('1')">1</button>
          <button type="button" (click)="addDigit('2')">2</button>
          <button type="button" (click)="addDigit('3')">3</button>
        </div>
        <div class="numpad-row">
          <button type="button" (click)="addDigit('4')">4</button>
          <button type="button" (click)="addDigit('5')">5</button>
          <button type="button" (click)="addDigit('6')">6</button>
        </div>
        <div class="numpad-row">
          <button type="button" (click)="addDigit('7')">7</button>
          <button type="button" (click)="addDigit('8')">8</button>
          <button type="button" (click)="addDigit('9')">9</button>
        </div>
        <div class="numpad-row">
          <button type="button" (click)="addDecimal()" [disabled]="hasDecimal">.</button>
          <button type="button" (click)="addDigit('0')">0</button>
          <button type="button" (click)="backspace()" class="backspace">⌫</button>
        </div>
        <div class="numpad-row">
          <button type="button" (click)="clear()" class="clear">Clear</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .amount-input-numpad {
      max-width: 400px;
      margin: 0 auto;
    }

    .amount-display {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      text-align: center;
    }

    .currency-toggle {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .currency-toggle button {
      padding: 6px 16px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .currency-toggle button.active {
      background: #f97316;
      color: white;
      border-color: #f97316;
    }

    .amount-value {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 60px;
    }

    .currency-symbol {
      font-size: 32px;
      color: #6b7280;
      font-weight: 600;
    }

    .amount {
      font-size: 48px;
      font-weight: 700;
      color: #111827;
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 120px;
      text-align: left;
    }

    .numpad {
      display: grid;
      gap: 12px;
    }

    .numpad-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .numpad-row:last-child {
      grid-template-columns: 1fr;
    }

    .numpad button {
      height: 60px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 8px;
      font-size: 24px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      color: #374151;
    }

    .numpad button:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .numpad button:active {
      transform: scale(0.95);
    }

    .numpad button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .numpad button.backspace {
      background: #fef3c7;
      border-color: #f59e0b;
      color: #92400e;
    }

    .numpad button.backspace:hover:not(:disabled) {
      background: #fde68a;
    }

    .numpad button.clear {
      background: #fee2e2;
      border-color: #ef4444;
      color: #dc2626;
      font-size: 18px;
    }

    .numpad button.clear:hover {
      background: #fecaca;
    }
  `]
})
export class AmountInputWithNumpadComponent implements OnInit, OnDestroy {
  @Input() currency: 'USD' | 'BRL' = 'USD';
  @Input() value = '0.00';
  @Output() onChange = new EventEmitter<string>();
  @Output() onCurrencyChange = new EventEmitter<'USD' | 'BRL'>();

  displayValue = '0.00';
  private rawValue = '';

  ngOnInit() {
    this.updateDisplay();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  get currencySymbol(): string {
    return this.currency === 'USD' ? '$' : 'R$';
  }

  get hasDecimal(): boolean {
    return this.rawValue.includes('.');
  }

  changeCurrency(newCurrency: 'USD' | 'BRL') {
    this.currency = newCurrency;
    this.onCurrencyChange.emit(newCurrency);
  }

  addDigit(digit: string) {
    if (this.rawValue === '0') {
      this.rawValue = digit;
    } else {
      this.rawValue += digit;
    }
    this.updateDisplay();
    this.emitChange();
  }

  addDecimal() {
    if (!this.hasDecimal) {
      if (this.rawValue === '') {
        this.rawValue = '0.';
      } else {
        this.rawValue += '.';
      }
      this.updateDisplay();
      this.emitChange();
    }
  }

  backspace() {
    if (this.rawValue.length > 0) {
      this.rawValue = this.rawValue.slice(0, -1);
    }
    if (this.rawValue === '' || this.rawValue === '0') {
      this.rawValue = '0';
    }
    this.updateDisplay();
    this.emitChange();
  }

  clear() {
    this.rawValue = '0';
    this.updateDisplay();
    this.emitChange();
  }

  private updateDisplay() {
    if (this.rawValue === '' || this.rawValue === '0') {
      this.displayValue = '0.00';
      return;
    }

    if (this.rawValue.endsWith('.')) {
      this.displayValue = this.rawValue;
      return;
    }

    const num = parseFloat(this.rawValue);
    if (isNaN(num)) {
      this.displayValue = '0.00';
      return;
    }

    // Format with appropriate decimal places
    if (this.hasDecimal) {
      const parts = this.rawValue.split('.');
      if (parts[1].length <= 2) {
        this.displayValue = this.rawValue;
      } else {
        this.displayValue = num.toFixed(2);
      }
    } else {
      this.displayValue = this.rawValue + '.00';
    }
  }

  private emitChange() {
    const num = parseFloat(this.rawValue);
    if (!isNaN(num)) {
      this.onChange.emit(num.toFixed(2));
    } else {
      this.onChange.emit('0.00');
    }
  }
}

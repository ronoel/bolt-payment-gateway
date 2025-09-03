import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StatusPillComponent } from '../status-pill/status-pill.component';
import { Invoice, ListInvoicesParams } from '../../services/gateway.service';

@Component({
  selector: 'app-invoice-table',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusPillComponent],
  template: `
    <div class="invoice-table-container">
      <!-- Filters -->
      <div class="filters">
        <select 
          class="filter-select"
          [(ngModel)]="currentFilters.status"
          (ngModelChange)="handleFilterChange()">
          <option value="">All Statuses</option>
          <option value="created">Created</option>
          <option value="paid">Paid</option>
          <option value="expired">Expired</option>
          <option value="settled">Settled</option>
        </select>

        <input 
          type="text"
          placeholder="Search by Order ID"
          class="filter-input"
          [(ngModel)]="currentFilters.merchant_order_id"
          (ngModelChange)="handleFilterChange()" />

        <input 
          type="date"
          placeholder="From Date"
          class="filter-input"
          [(ngModel)]="currentFilters.from_date"
          (ngModelChange)="handleFilterChange()" />

        <input 
          type="date"
          placeholder="To Date"
          class="filter-input"
          [(ngModel)]="currentFilters.to_date"
          (ngModelChange)="handleFilterChange()" />
      </div>

      <!-- Table -->
      @if (items.length > 0) {
        <div class="table-responsive">
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Order ID</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              @for (invoice of items; track invoice?.invoice_id || $index) {
                @if (invoice && invoice.invoice_id) {
                  <tr class="clickable-row" (click)="openInvoice(invoice.invoice_id)">
                    <td class="invoice-id">{{ shortId(invoice.invoice_id) }}</td>
                    <td>
                      <app-status-pill [status]="invoice.status"></app-status-pill>
                    </td>
                    <td class="amount">
                      {{ formatAmount(invoice.amount) }} {{ invoice.settlement_asset }}
                    </td>
                    <td class="order-id">{{ invoice.merchant_order_id || '-' }}</td>
                    <td class="created-date">{{ formatDate(invoice.created_at) }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <div class="pagination-info">
            Showing {{ offset + 1 }} to {{ Math.min(offset + limit, total) }} of {{ total }} invoices
          </div>
          <div class="pagination-controls">
            <button 
              class="pagination-btn"
              [disabled]="offset === 0"
              (click)="previousPage()">
              Previous
            </button>
            <button 
              class="pagination-btn"
              [disabled]="offset + limit >= total"
              (click)="nextPage()">
              Next
            </button>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">📄</div>
          <h3>No invoices yet</h3>
          <p>Create your first invoice to get started.</p>
          <button class="create-btn" [routerLink]="['/invoices/new']">
            Create Invoice
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .invoice-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      overflow: hidden;
    }

    .filters {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      flex-wrap: wrap;
    }

    .filter-select,
    .filter-input {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      min-width: 150px;
    }

    .filter-select:focus,
    .filter-input:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgb(249 115 22 / 0.1);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .invoice-table {
      width: 100%;
      border-collapse: collapse;
    }

    .invoice-table th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .invoice-table td {
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
    }

    .invoice-table tr:hover {
      background: #f9fafb;
    }

    .clickable-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .clickable-row:hover {
      background-color: #f3f4f6 !important;
    }

    .invoice-id {
      font-family: monospace;
      color: #6b7280;
    }

    .amount {
      font-weight: 600;
      color: #111827;
    }

    .order-id {
      color: #6b7280;
    }

    .created-date {
      color: #6b7280;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
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

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    .pagination-info {
      font-size: 14px;
      color: #6b7280;
    }

    .pagination-controls {
      display: flex;
      gap: 8px;
    }

    .pagination-btn {
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 64px 32px;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 18px;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: #6b7280;
    }

    .create-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }

    .create-btn:hover {
      background: #ea580c;
    }
  `]
})
export class InvoiceTableComponent {
  private router = inject(Router);
  
  @Input() items: Invoice[] = [];
  @Input() total = 0;
  @Input() limit = 20;
  @Input() offset = 0;
  @Input() filters: ListInvoicesParams = {};

  @Output() onFilterChange = new EventEmitter<ListInvoicesParams>();
  @Output() onPageChange = new EventEmitter<{ limit: number; offset: number }>();
  @Output() onCopyLink = new EventEmitter<string>();
  @Output() onShowQR = new EventEmitter<string>();

  currentFilters: ListInvoicesParams = {};

  Math = Math;

  ngOnInit() {
    this.currentFilters = { ...this.filters };
  }

  handleFilterChange() {
    this.onFilterChange.emit({ ...this.currentFilters });
  }

  previousPage() {
    if (this.offset > 0) {
      const newOffset = Math.max(0, this.offset - this.limit);
      this.onPageChange.emit({ limit: this.limit, offset: newOffset });
    }
  }

  nextPage() {
    if (this.offset + this.limit < this.total) {
      const newOffset = this.offset + this.limit;
      this.onPageChange.emit({ limit: this.limit, offset: newOffset });
    }
  }

  copyLink(url: string) {
    navigator.clipboard.writeText(url);
    this.onCopyLink.emit(url);
  }

  showQR(url: string) {
    this.onShowQR.emit(url);
  }

  openInvoice(invoiceId: string) {
    this.router.navigate(['/invoices', invoiceId]);
  }

  shortId(id: string): string {
    if (!id || typeof id !== 'string') {
      return '';
    }
    return id.length > 8 ? `${id.slice(0, 8)}...` : id;
  }

  formatAmount(amount: string): string {
    if (!amount || typeof amount !== 'string') {
      return '0.00';
    }
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
  }

  formatDate(dateString: string): string {
    if (!dateString || typeof dateString !== 'string') {
      return '';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format as: MM/DD/YYYY HH:MM
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return date.toLocaleDateString('en-US', options).replace(',', '');
  }
}

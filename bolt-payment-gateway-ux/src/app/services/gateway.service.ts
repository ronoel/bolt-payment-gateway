import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BoltContractSBTCService } from './bolt-contract-sbtc.service';

// Interfaces based on OpenAPI schema
export interface ErrorResponse {
  error: string;
  message: string;
}

export interface Quote {
  from_asset: string;
  to_asset: string;
  from_amount: string;
  to_amount: string;
  unit_price: string;
  spread: string;
  refreshed_at: string;
}

export interface Invoice {
  invoice_id: string;
  status: 'created' | 'paid' | 'expired' | 'settled';
  amount: string;
  settlement_asset: 'USD' | 'BRL';
  merchant_order_id: string;
  created_at: string;
  checkout_url: string;
}

export interface PaymentResult {
  payment_id: string;
  invoice_id: string;
  status: 'accepted' | 'rejected' | 'confirmed';
  asset: string;
  amount: string;
  sender_address?: string;
  received_at: string;
  tx_id?: string;
}

export interface CreateInvoiceRequest {
  amount: string;
  settlement_asset: 'USD' | 'BRL';
  merchant_order_id: string;
}

export interface SubmitPaymentRequest {
  serialized_transaction: string;
  asset: string;
  amount: string;
}

export interface ListInvoicesResponse {
  items: Invoice[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListInvoicesParams {
  status?: 'created' | 'paid' | 'expired' | 'settled';
  merchant_order_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface QuoteParams {
  from: string;
  to: string;
  to_amount: string;
}

// Custom error class for Gateway API errors
export class GatewayError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class GatewayService {
  private baseUrl = environment.apiUrl;
  private frontendUrl = 'http://localhost:4200'; // Current frontend URL
  transactionService: any;

  constructor(
    private http: HttpClient,
    private boltContractSBTCService: BoltContractSBTCService
  ) {}

  /**
   * Handle HTTP errors and convert them to GatewayError
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let gatewayError: GatewayError;

    if (error.error && error.error.error && error.error.message) {
      // API returned an ErrorResponse
      gatewayError = new GatewayError(
        error.error.error,
        error.error.message,
        error.status
      );
    } else {
      // Network or other error
      gatewayError = new GatewayError(
        'network_error',
        error.message || 'An unknown error occurred',
        error.status
      );
    }

    return throwError(() => gatewayError);
  };

  /**
   * Create a new invoice for a merchant
   * POST /merchants/{wallet_address}/invoices
   */
  createInvoice(walletAddress: string, request: CreateInvoiceRequest): Observable<Invoice> {
    const url = `${this.baseUrl}/merchants/${walletAddress}/invoices`;
    return this.http.post<Invoice>(url, request).pipe(
      map((invoice: any) => ({
        ...invoice,
        invoice_id: invoice.id || invoice.invoice_id, // Map 'id' to 'invoice_id'
        checkout_url: `${this.frontendUrl}/pay/${invoice.id || invoice.invoice_id}`
      })),
      catchError(this.handleError)
    );
  }

  /**
   * List and search merchant invoices with optional filtering
   * GET /merchants/{wallet_address}/invoices
   */
  listInvoices(walletAddress: string, params?: ListInvoicesParams): Observable<ListInvoicesResponse> {
    const url = `${this.baseUrl}/merchants/${walletAddress}/invoices`;
    
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.merchant_order_id) {
        httpParams = httpParams.set('merchant_order_id', params.merchant_order_id);
      }
      if (params.from_date) {
        httpParams = httpParams.set('from_date', params.from_date);
      }
      if (params.to_date) {
        httpParams = httpParams.set('to_date', params.to_date);
      }
      if (params.limit !== undefined) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
      if (params.offset !== undefined) {
        httpParams = httpParams.set('offset', params.offset.toString());
      }
    }

    return this.http.get<ListInvoicesResponse>(url, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        items: response.items.map((invoice: any) => ({
          ...invoice,
          invoice_id: invoice.id || invoice.invoice_id, // Map 'id' to 'invoice_id'
          checkout_url: `${this.frontendUrl}/pay/${invoice.id || invoice.invoice_id}`
        }))
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Retrieve a specific invoice by ID
   * GET /invoices/{invoice_id}
   */
  getInvoice(invoiceId: string): Observable<Invoice> {
    const url = `${this.baseUrl}/invoices/${invoiceId}`;
    return this.http.get<Invoice>(url).pipe(
      map((invoice: any) => ({
        ...invoice,
        invoice_id: invoice.id || invoice.invoice_id, // Map 'id' to 'invoice_id'
        checkout_url: `${this.frontendUrl}/pay/${invoice.id || invoice.invoice_id}`
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Submit a payment transaction for an invoice
   * POST /invoices/{invoice_id}/payments/submit
   */
  submitPayment(invoice: Invoice, amount: string): Observable<PaymentResult> {
    const url = `${this.baseUrl}/invoices/${invoice.invoice_id}/payments/submit`;

    // get the serialized transaction and then submit payment
    return this.boltContractSBTCService.transferBoltToBolt(
      parseInt(amount),
      environment.gatewayAddress,
      `BG-MID: ${invoice.merchant_order_id}`
    ).pipe(
      map((serialized_transaction: string) => {
        const request: SubmitPaymentRequest = {
          serialized_transaction: serialized_transaction,
          asset: 'sBTC',
          amount: amount
        };
        return request;
      }),
      switchMap((request: SubmitPaymentRequest) => {
        return this.http.post<PaymentResult>(url, request);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get a conversion quote from one asset to another
   * GET /quotes
   */
  getQuote(params: QuoteParams): Observable<Quote> {
    const url = `${this.baseUrl}/quotes`;
    
    let httpParams = new HttpParams()
      .set('from', params.from)
      .set('to', params.to)
      .set('to_amount', params.to_amount);

    return this.http.get<Quote>(url, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Helper method to get BTC amount needed for a USD amount
   */
  getBtcAmountForUsd(usdAmount: string): Observable<Quote> {
    return this.getQuote({
      from: 'BTC',
      to: 'USD',
      to_amount: usdAmount
    });
  }

  /**
   * Helper method to create an invoice and get the checkout URL
   */
  createInvoiceWithCheckout(
    walletAddress: string, 
    amount: string, 
    settlementAsset: 'USD' | 'BRL', 
    merchantOrderId: string
  ): Observable<Invoice> {
    return this.createInvoice(walletAddress, {
      amount,
      settlement_asset: settlementAsset,
      merchant_order_id: merchantOrderId
    });
  }

  /**
   * Helper method to check invoice status
   */
  checkInvoiceStatus(invoiceId: string): Observable<'created' | 'paid' | 'expired' | 'settled'> {
    return this.getInvoice(invoiceId).pipe(
      map(invoice => invoice.status)
    );
  }

  /**
   * Helper method to poll invoice status until it changes
   */
  pollInvoiceStatus(
    invoiceId: string, 
    intervalMs: number = 5000, 
    timeoutMs: number = 300000
  ): Observable<Invoice> {
    return new Observable(observer => {
      const startTime = Date.now();
      
      const poll = () => {
        if (Date.now() - startTime > timeoutMs) {
          observer.error(new GatewayError('polling_timeout', 'Polling timeout exceeded'));
          return;
        }

        this.getInvoice(invoiceId).subscribe({
          next: (invoice) => {
            if (invoice.status === 'paid' || invoice.status === 'expired' || invoice.status === 'settled') {
              observer.next(invoice);
              observer.complete();
            } else {
              setTimeout(poll, intervalMs);
            }
          },
          error: (error) => observer.error(error)
        });
      };

      poll();
    });
  }

  /**
   * Helper method to validate wallet address format
   */
  isValidWalletAddress(address: string): boolean {
    // Basic validation for Stacks wallet address
    return /^S[T123456789ABCDEFGHJKMNPQRSTVWXYZ]{39}$/.test(address);
  }

  /**
   * Helper method to format amount with proper decimals
   */
  formatAmount(amount: string | number, decimals: number = 2): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(decimals);
  }

  /**
   * Helper method to convert satoshis to BTC
   */
  satoshisToBtc(satoshis: string | number): string {
    const sats = typeof satoshis === 'string' ? parseInt(satoshis) : satoshis;
    return (sats / 100000000).toFixed(8);
  }

  /**
   * Helper method to generate short links (if your API supports it)
   */
  getShortUrl(invoiceId: string): string {
    return `${this.frontendUrl}/i/${invoiceId}`;
  }

  /**
   * Helper method to convert BTC to satoshis
   */
  btcToSatoshis(btc: string | number): string {
    const btcAmount = typeof btc === 'string' ? parseFloat(btc) : btc;
    return Math.round(btcAmount * 100000000).toString();
  }

}

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GatewayService, CreateInvoiceRequest, Invoice, Quote, PaymentResult } from './gateway.service';
import { environment } from '../../environments/environment';

describe('GatewayService', () => {
  let service: GatewayService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GatewayService]
    });
    service = TestBed.inject(GatewayService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createInvoice', () => {
    it('should create an invoice', () => {
      const walletAddress = 'SP3FBR2AGKX6Q2P3W9GH8ZC5ZZ5W9S9C8F3W9C1A';
      const request: CreateInvoiceRequest = {
        amount: '49.90',
        settlement_asset: 'USD',
        merchant_order_id: 'ORD-12345'
      };
      const mockInvoice: Invoice = {
        invoice_id: 'inv_001',
        status: 'created',
        amount: '49.90',
        settlement_asset: 'USD',
        merchant_order_id: 'ORD-12345',
        created_at: '2025-08-26T00:03:12Z',
        checkout_url: 'https://pay.example.com/i/inv_001'
      };

      service.createInvoice(walletAddress, request).subscribe(invoice => {
        expect(invoice).toEqual(mockInvoice);
      });

      const req = httpMock.expectOne(`${baseUrl}/merchants/${walletAddress}/invoices`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockInvoice);
    });
  });

  describe('getQuote', () => {
    it('should get a quote', () => {
      const mockQuote: Quote = {
        from_asset: 'BTC',
        to_asset: 'USD',
        from_amount: '153846',
        to_amount: '100.00',
        unit_price: '65000.00',
        spread: '1.00%',
        refreshed_at: '2025-08-26T00:03:32Z'
      };

      service.getBtcAmountForUsd('100.00').subscribe(quote => {
        expect(quote).toEqual(mockQuote);
      });

      const req = httpMock.expectOne(`${baseUrl}/quotes?from=BTC&to=USD&to_amount=100.00`);
      expect(req.request.method).toBe('GET');
      req.flush(mockQuote);
    });
  });

  describe('getInvoice', () => {
    it('should get an invoice by ID', () => {
      const invoiceId = 'inv_001';
      const mockInvoice: Invoice = {
        invoice_id: 'inv_001',
        status: 'paid',
        amount: '49.90',
        settlement_asset: 'USD',
        merchant_order_id: 'ORD-12345',
        created_at: '2025-08-26T00:03:12Z',
        checkout_url: 'https://pay.example.com/i/inv_001'
      };

      service.getInvoice(invoiceId).subscribe(invoice => {
        expect(invoice).toEqual(mockInvoice);
      });

      const req = httpMock.expectOne(`${baseUrl}/invoices/${invoiceId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInvoice);
    });
  });

  describe('listInvoices', () => {
    it('should list invoices for a merchant', () => {
      const walletAddress = 'SP3FBR2AGKX6Q2P3W9GH8ZC5ZZ5W9S9C8F3W9C1A';
      const mockResponse = {
        items: [],
        total: 0,
        limit: 20,
        offset: 0
      };

      service.listInvoices(walletAddress).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/merchants/${walletAddress}/invoices`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should list invoices with filters', () => {
      const walletAddress = 'SP3FBR2AGKX6Q2P3W9GH8ZC5ZZ5W9S9C8F3W9C1A';
      const params = {
        status: 'paid' as const,
        limit: 10,
        offset: 0
      };

      service.listInvoices(walletAddress, params).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/merchants/${walletAddress}/invoices?status=paid&limit=10&offset=0`);
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], total: 0, limit: 10, offset: 0 });
    });
  });

  describe('submitPayment', () => {
    it('should submit a payment', () => {
      const invoiceId = 'inv_001';
      const paymentRequest = {
        serialized_transaction: '0xabcdef123456',
        asset: 'sBTC',
        amount: '0.002345'
      };
      const mockResult: PaymentResult = {
        payment_id: 'pay_001',
        invoice_id: 'inv_001',
        status: 'accepted',
        asset: 'sBTC',
        amount: '0.002345',
        received_at: '2025-08-26T00:05:12Z'
      };

      service.submitPayment(invoiceId, paymentRequest).subscribe(result => {
        expect(result).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${baseUrl}/invoices/${invoiceId}/payments/submit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(paymentRequest);
      req.flush(mockResult);
    });
  });

  describe('utility methods', () => {
    it('should validate wallet addresses', () => {
      expect(service.isValidWalletAddress('SP3FBR2AGKX6Q2P3W9GH8ZC5ZZ5W9S9C8F3W9C1A')).toBe(true);
      expect(service.isValidWalletAddress('ST3FBR2AGKX6Q2P3W9GH8ZC5ZZ5W9S9C8F3W9C1A')).toBe(true);
      expect(service.isValidWalletAddress('invalid-address')).toBe(false);
    });

    it('should convert satoshis to BTC', () => {
      expect(service.satoshisToBtc('100000000')).toBe('1.00000000');
      expect(service.satoshisToBtc('50000000')).toBe('0.50000000');
      expect(service.satoshisToBtc(153846)).toBe('0.00153846');
    });

    it('should convert BTC to satoshis', () => {
      expect(service.btcToSatoshis('1.0')).toBe('100000000');
      expect(service.btcToSatoshis('0.5')).toBe('50000000');
      expect(service.btcToSatoshis(0.00153846)).toBe('153846');
    });

    it('should format amounts', () => {
      expect(service.formatAmount('49.9', 2)).toBe('49.90');
      expect(service.formatAmount(100, 2)).toBe('100.00');
      expect(service.formatAmount('123.456', 3)).toBe('123.456');
    });
  });
});

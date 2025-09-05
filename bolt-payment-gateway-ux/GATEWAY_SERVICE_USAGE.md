# Gateway Service Usage Guide

This document explains how to use the Gateway Service to interact with the sBTC Payment Gateway API.

## Overview

The `GatewayService` provides methods to:
- Create invoices for merchants
- List and search merchant invoices
- Retrieve invoice details
- Submit payments for invoices
- Get conversion quotes between assets
- Poll for invoice status changes

## Setup

The service is already configured to use the API URL from the environment configuration and includes proper error handling.

## Basic Usage Examples

### 1. Creating an Invoice

```typescript
import { GatewayService, CreateInvoiceRequest } from './services/gateway.service';

constructor(private gatewayService: GatewayService) {}

createInvoice() {
  const walletAddress = 'SP3FBR2AGKX6Q2P3W9GH8ZC5ZZ5W9S9C8F3W9C1A';
  const request: CreateInvoiceRequest = {
    amount: "49.90",
    settlement_asset: 'USD',
    merchant_order_id: 'ORD-12345'
  };

  this.gatewayService.createInvoice(walletAddress, request).subscribe({
    next: (invoice) => {
      console.log('Invoice created:', invoice);
      console.log('Checkout URL:', invoice.checkout_url);
    },
    error: (error) => {
      console.error('Error creating invoice:', error);
    }
  });
}
```

### 2. Getting a Quote

```typescript
getQuote() {
  // Get how much BTC is needed for $100 USD
  this.gatewayService.getBtcAmountForUsd("100.00").subscribe({
    next: (quote) => {
      console.log('Quote:', quote);
      console.log('BTC needed:', this.gatewayService.satoshisToBtc(quote.from_amount));
      console.log('Rate:', quote.unit_price, 'USD per BTC');
    },
    error: (error) => {
      console.error('Error getting quote:', error);
    }
  });
}
```

### 3. Retrieving an Invoice

```typescript
getInvoice(invoiceId: string) {
  this.gatewayService.getInvoice(invoiceId).subscribe({
    next: (invoice) => {
      console.log('Invoice:', invoice);
      console.log('Status:', invoice.status);
    },
    error: (error) => {
      console.error('Error fetching invoice:', error);
    }
  });
}
```

### 4. Listing Merchant Invoices

```typescript
listInvoices() {
  const walletAddress = 'SP3FBR2AGKX6Q2P3W9GH8ZC5ZZ5W9S9C8F3W9C1A';
  const params = {
    status: 'paid' as const,
    limit: 20,
    offset: 0
  };

  this.gatewayService.listInvoices(walletAddress, params).subscribe({
    next: (response) => {
      console.log('Invoices:', response.items);
      console.log('Total:', response.total);
    },
    error: (error) => {
      console.error('Error listing invoices:', error);
    }
  });
}
```

### 5. Submitting a Payment

```typescript
submitPayment(invoiceId: string) {
  const paymentRequest = {
    serialized_transaction: "0xabcdef123456...",
    asset: "sBTC",
    amount: "0.002345"
  };

  this.gatewayService.submitPayment(invoiceId, paymentRequest).subscribe({
    next: (result) => {
      console.log('Payment result:', result);
      console.log('Payment ID:', result.payment_id);
      console.log('Status:', result.status);
    },
    error: (error) => {
      console.error('Error submitting payment:', error);
    }
  });
}
```

### 6. Polling for Invoice Status Changes

```typescript
pollInvoiceStatus(invoiceId: string) {
  // Poll every 5 seconds for up to 5 minutes
  this.gatewayService.pollInvoiceStatus(invoiceId, 5000, 300000).subscribe({
    next: (invoice) => {
      console.log('Invoice status changed to:', invoice.status);
      // Handle the status change (paid, expired, settled)
    },
    error: (error) => {
      console.error('Polling error:', error);
    }
  });
}
```

## Available Interfaces

### CreateInvoiceRequest
```typescript
interface CreateInvoiceRequest {
  amount: string;
  settlement_asset: 'USD' | 'BRL';
  merchant_order_id: string;
}
```

### Invoice
```typescript
interface Invoice {
  invoice_id: string;
  status: 'created' | 'paid' | 'expired' | 'settled';
  amount: string;
  settlement_asset: 'USD' | 'BRL';
  merchant_order_id: string;
  created_at: string;
  checkout_url: string;
}
```

### Quote
```typescript
interface Quote {
  from_asset: string;
  to_asset: string;
  from_amount: string;  // in satoshis
  to_amount: string;    // in USD
  unit_price: string;   // USD per BTC
  spread: string;       // percentage
  refreshed_at: string;
}
```

### PaymentResult
```typescript
interface PaymentResult {
  payment_id: string;
  invoice_id: string;
  status: 'accepted' | 'rejected' | 'confirmed';
  asset: string;
  amount: string;
  sender_address?: string;
  received_at: string;
  tx_id?: string;
}
```

## Helper Methods

The service includes several utility methods:

- `isValidWalletAddress(address: string): boolean` - Validate Stacks wallet addresses
- `formatAmount(amount: string | number, decimals: number): string` - Format amounts with decimals
- `satoshisToBtc(satoshis: string | number): string` - Convert satoshis to BTC
- `btcToSatoshis(btc: string | number): string` - Convert BTC to satoshis

## Error Handling

All methods return observables with proper error handling. Errors are wrapped in `GatewayError` objects that include:

```typescript
class GatewayError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly statusCode?: number
  ) {}
}
```

Example error handling:
```typescript
this.gatewayService.createInvoice(walletAddress, request).subscribe({
  error: (error: GatewayError) => {
    console.error('Error code:', error.errorCode);
    console.error('Message:', error.message);
    console.error('HTTP status:', error.statusCode);
  }
});
```

## Environment Configuration

The service uses the `apiUrl` from the environment configuration:

- Development: `http://localhost:3000/api/v1`
- Production: `https://boltproto.org/api/v1`

Make sure the environment files are properly configured for your setup.

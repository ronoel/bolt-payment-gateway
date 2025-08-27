// src/models/dto.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::models::{Invoice, Payment, InvoiceStatus, SettlementAsset, PaymentStatus, PaymentToken};

// Request DTOs
#[derive(Debug, Deserialize)]
pub struct CreateInvoiceRequest {
    pub amount: String,
    pub settlement_asset: SettlementAsset,
    pub merchant_order_id: String,
}

#[derive(Debug, Deserialize)]
pub struct SubmitPaymentRequest {
    pub serialized_transaction: String,
    pub asset: PaymentToken,
    pub amount: String,
}

#[derive(Debug, Deserialize)]
pub struct ListInvoicesQuery {
    pub status: Option<InvoiceStatus>,
    pub merchant_order_id: Option<String>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
    #[serde(default = "default_limit")]
    pub limit: usize,
    #[serde(default)]
    pub offset: usize,
}

fn default_limit() -> usize {
    20
}

/// Convert u128 amount to USD string with 2 decimal places
/// Example: 2345 -> "23.45", 4 -> "0.04", 100 -> "1.00"
pub fn format_money_amount(amount: u128) -> String {
    let dollars = amount / 100;
    let cents = amount % 100;
    format!("{}.{:02}", dollars, cents)
}

pub fn convert_money_from_string(amount: String) -> Result<u128, ()> {
    // Parse the amount string (e.g., "23.45" -> 2345, "1.00" -> 100)
    let parts: Vec<&str> = amount.split('.').collect();
    match parts.len() {
        1 => {
            // No decimal point, treat as dollars
            let dollars = parts[0].parse::<u128>().map_err(|_| ())?;
            Ok(dollars * 100)
        }
        2 => {
            // Has decimal point
            let dollars = parts[0].parse::<u128>().map_err(|_| ())?;
            let cents_str = if parts[1].len() == 1 {
                format!("{}0", parts[1]) // "5" -> "50"
            } else if parts[1].len() == 2 {
                parts[1].to_string()
            } else {
                return Err(()); // Invalid format
            };
            let cents = cents_str.parse::<u128>().map_err(|_| ())?;
            Ok(dollars * 100 + cents)
        }
        _ => Err(()),
    }
}

// Response DTOs
#[derive(Debug, Serialize)]
pub struct InvoiceResponse {
    pub invoice_id: String,
    pub status: InvoiceStatus,
    pub amount: String,
    pub settlement_asset: SettlementAsset,
    pub merchant_order_id: String,
    pub created_at: DateTime<Utc>,
    pub checkout_url: String,
}

impl From<Invoice> for InvoiceResponse {
    fn from(invoice: Invoice) -> Self {
        Self {
            checkout_url: format!("https://pay.example.com/i/{}", invoice.invoice_id),
            invoice_id: invoice.invoice_id,
            status: invoice.status,
            amount: format_money_amount(invoice.amount),
            settlement_asset: invoice.settlement_asset,
            merchant_order_id: invoice.merchant_order_id,
            created_at: invoice.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct PaymentResponse {
    pub payment_id: String,
    pub invoice_id: String,
    pub status: PaymentStatus,
    pub asset: PaymentToken,
    pub amount: String,
    pub received_at: DateTime<Utc>,
    pub tx_id: String,
}

impl From<Payment> for PaymentResponse {
    fn from(payment: Payment) -> Self {
        Self {
            payment_id: payment.payment_id,
            invoice_id: payment.invoice_id,
            status: payment.status,
            asset: payment.asset,
            amount: format_money_amount(payment.amount),
            received_at: payment.received_at,
            tx_id: payment.tx_id,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ListInvoicesResponse {
    pub items: Vec<InvoiceResponse>,
    pub total: usize,
    pub limit: usize,
    pub offset: usize,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

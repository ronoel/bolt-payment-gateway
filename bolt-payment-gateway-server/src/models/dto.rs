use axum::{http::StatusCode, Json};
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

// Response DTOs
#[derive(Debug, Serialize)]
pub struct InvoiceResponse {
    pub id: String,
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
            checkout_url: format!("https://test.boltproto.org/checkout/{}", invoice.id.to_string()),
            id: invoice.id.to_string(),
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
    pub id: String,
    pub invoice_id: String,
    pub status: PaymentStatus,
    pub asset: PaymentToken,
    pub amount: String,
    pub sender_address: Option<String>,
    pub received_at: DateTime<Utc>,
    pub tx_id: Option<String>,
}

impl From<Payment> for PaymentResponse {
    fn from(payment: Payment) -> Self {
        Self {
            id: payment.id.to_string(),
            invoice_id: payment.invoice_id.to_string(),
            status: payment.status,
            asset: payment.asset,
            // amount: format_money_amount(payment.amount), // if this is in USD
            amount: payment.amount.to_string(),
            sender_address: payment.sender_address,
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

#[derive(Debug, Deserialize)]
pub struct QuoteQuery {
    pub from: String,
    pub to: String,
    pub to_amount: String,
}

#[derive(Debug, Serialize)]
pub struct QuoteResponse {
    pub from_asset: String,
    pub to_asset: String,
    pub from_amount: String,
    pub to_amount: String,
    pub unit_price: String,
    pub spread: String,
    pub refreshed_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}


/// Convert string to objectId
/// Example: "507f1f77bcf86cd799439011" -> ObjectId::with_string("507f1f77bcf86cd799439011")
pub fn convert_string_to_object_id(id: &str) -> Result<bson::oid::ObjectId, (StatusCode, Json<ErrorResponse>)> {
    bson::oid::ObjectId::parse_str(id).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_object_id".to_string(),
                message: "Invalid ObjectId format".to_string(),
            }),
        )
    })
}

/// Convert u128 amount to USD string with 2 decimal places
/// Example: 2345 -> "23.45", 4 -> "0.04", 100 -> "1.00"
pub fn format_money_amount(amount: u128) -> String {
    let dollars = amount / 100;
    let cents = amount % 100;
    format!("{}.{:02}", dollars, cents)
}

pub fn convert_money_from_string(amount: String) -> Result<u128, ()> {
    // Parse the amount string (e.g., "23.45" -> 2345, "121.45454" -> 12145)
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
            let decimal_part = parts[1];
            
            // Take only first 2 digits for cents, pad with 0 if needed
            let cents_str = if decimal_part.is_empty() {
                "00".to_string()
            } else if decimal_part.len() == 1 {
                format!("{}0", &decimal_part[0..1])
            } else {
                decimal_part[0..2].to_string() // Take first 2 digits only
            };
            
            let cents = cents_str.parse::<u128>().map_err(|_| ())?;
            Ok(dollars * 100 + cents)
        }
        _ => Err(()),
    }
}
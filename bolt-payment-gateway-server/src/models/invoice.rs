// src/models/invoice.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Invoice entity — mirrors the OpenAPI schema.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Invoice {
    /// Unique identifier of the invoice.
    pub invoice_id: String,

    /// Current status of the invoice.
    pub status: InvoiceStatus,

    /// Amount of the invoice in the settlement asset (kept as string to match the schema).
    pub amount: u128,

    /// Asset in which the merchant will settle.
    pub settlement_asset: SettlementAsset,

    /// Merchant-defined order ID.
    pub merchant_order_id: String,

    /// Timestamp when the invoice was created (RFC3339).
    pub created_at: DateTime<Utc>,

    /// Timestamp when the invoice should expire if defined by the merchant
    pub expires_at: Option<DateTime<Utc>>,
}

/// `status`: ["paid", "expired", "settled"]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InvoiceStatus {
    /// Invoice has been created and is awaiting payment.
    Created,
    /// Customer has successfully completed the payment.
    Paid,
    /// Invoice has exceeded its validity period without receiving payment.
    /// No further payments can be accepted for this invoice.
    Expired,
    /// Payment has been processed and funds have been transferred to the merchant.
    /// This is the final successful state of an invoice.
    Settled,
}

/// `settlement_asset`: ["USD", "BRL"]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SettlementAsset {
    USD,
    BRL,
}

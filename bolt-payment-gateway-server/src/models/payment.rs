// src/models/payment.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Payment entity — mirrors the OpenAPI schema.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Payment {
    /// Unique identifier of the payment attempt.
    pub payment_id: String,

    /// Invoice ID associated with this payment.
    pub invoice_id: String,

    /// Current status of the payment.
    pub status: PaymentStatus,

    /// Asset used in the payment (ex: "sBTC").
    pub asset: PaymentToken,

    /// Actual amount processed in this payment.
    pub amount: u128,

    /// Timestamp when the payment was received (RFC3339).
    pub received_at: DateTime<Utc>,

    /// Transaction ID/hash on the underlying network.
    pub tx_id: String,
}

/// `status`: ["accepted", "rejected", "confirmed"]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaymentStatus {
    /// Payment has been accepted and is being processed.
    Accepted,
    /// Payment has been rejected.
    Rejected,
    /// Payment has been confirmed.
    Confirmed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PaymentToken {
    #[serde(rename = "sBTC")]
    SBtc,
    #[serde(rename = "USDT")]
    Usdt,
}

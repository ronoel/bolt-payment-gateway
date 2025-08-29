// src/models/payment.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Payment entity — mirrors the OpenAPI schema.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Payment {
    /// Unique identifier of the payment attempt.
    #[serde(rename = "_id")]
    pub id: bson::oid::ObjectId,

    /// Invoice ID associated with this payment.
    pub invoice_id: bson::oid::ObjectId,

    /// Current status of the payment.
    pub status: PaymentStatus,

    /// Asset used in the payment (ex: "sBTC").
    pub asset: PaymentToken,

    /// Actual amount processed in this payment.
    #[serde(with = "u128_as_i64")]
    pub amount: u128,

    /// Address of the sender making the payment.
    pub sender_address: Option<String>,

    /// Timestamp when the payment was received (RFC3339).
    pub received_at: DateTime<Utc>,

    /// Transaction ID/hash on the underlying network.
    pub tx_id: Option<String>,
}

impl Payment {
    pub fn new(invoice_id: bson::oid::ObjectId, asset: PaymentToken, amount: u128) -> Self {
        Self {
            id: bson::oid::ObjectId::new(),
            invoice_id,
            status: PaymentStatus::Accepted,
            asset,
            amount,
            sender_address: None,
            received_at: Utc::now(),
            tx_id: None,
        }
    }
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
    SBTC,
    #[serde(rename = "USDT")]
    USDT,
}

// Custom serialization/deserialization for u128 as i64 for MongoDB compatibility
mod u128_as_i64 {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    pub fn serialize<S>(value: &u128, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let i64_value = i64::try_from(*value)
            .map_err(|_| serde::ser::Error::custom("Value too large for i64"))?;
        i64_value.serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<u128, D::Error>
    where
        D: Deserializer<'de>,
    {
        let i64_value = i64::deserialize(deserializer)?;
        if i64_value < 0 {
            return Err(serde::de::Error::custom("Negative values not allowed"));
        }
        Ok(i64_value as u128)
    }
}
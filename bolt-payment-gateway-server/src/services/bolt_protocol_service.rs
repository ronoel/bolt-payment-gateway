use anyhow::Result;
use axum::{Json, response::ErrorResponse};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
struct BroadcastTransactionRequest {
    #[serde(rename = "serializedTx")]
    serialized_tx: String,
    amount: String,
    #[serde(rename = "recipientAddress")]
    recipient_address: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BroadcastTransactionResponse {
    pub txid: String,
    pub fee: f64,
    pub sender: String,
    pub amount: String,
}

pub struct BoltTransactionResponse {
    pub txid: String,
    pub sender: String,
    pub amount: u128,
}

impl BoltTransactionResponse {
    pub fn from(dto: BroadcastTransactionResponse) -> Result<Self> {
        Ok(BoltTransactionResponse {
            txid: dto.txid,
            sender: dto.sender,
            amount: dto.amount.parse::<u128>()?,
        })
    }
}

#[derive(Clone)]
pub struct BoltProtocolService {
    base_url: String,
    client: reqwest::Client,
}

impl BoltProtocolService {
    pub fn new() -> Self {
        let client = reqwest::Client::new();
        BoltProtocolService {
            base_url: "http://localhost:3000".to_string(),
            client,
        }
    }

    pub async fn broadcast_transaction(
        &self,
        serialized_tx: String,
        valid_amount: u128,
        valid_recipient_address: String,
    ) -> Result<BoltTransactionResponse, (StatusCode, Json<ErrorResponse>)> {
        let request = BroadcastTransactionRequest {
            serialized_tx,
            amount: valid_amount.to_string(),
            recipient_address: valid_recipient_address,
        };

        let url = format!("{}/api/v1/transaction/bolt/broadcast", self.base_url);

        let response = self.client.post(&url).json(&request).send().await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse::from(e.to_string()))))?;

        if response.status().is_success() {
            let broadcast_response: BroadcastTransactionResponse = response.json().await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse::from(e.to_string()))))?;
            let bolt_response = BoltTransactionResponse::from(broadcast_response)
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse::from(e.to_string()))))?;
            Ok(bolt_response)
        } else {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            let error_response = ErrorResponse::from(error_text);
            Err((status, Json(error_response)))
        }
    }
}
// Add fields and methods as needed

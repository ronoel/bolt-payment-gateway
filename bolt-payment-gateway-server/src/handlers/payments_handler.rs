// src/handlers/payments.rs
use axum::{
    extract::Path,
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use uuid::Uuid;

use crate::models::{
    convert_money_from_string, ErrorResponse, Payment, PaymentResponse, PaymentStatus, SubmitPaymentRequest
};

/// Submit a payment transaction for an invoice
pub async fn submit_payment(
    Path(invoice_id): Path<String>,
    Json(request): Json<SubmitPaymentRequest>,
) -> Result<Json<PaymentResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate amount
    if request.amount.parse::<f64>().is_err() || request.amount.parse::<f64>().unwrap() <= 0.0 {
        return Err((
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse {
                error: "invalid_amount".to_string(),
                message: "Payment amount must be a positive number".to_string(),
            }),
        ));
    }

    // Validate serialized transaction (basic validation)
    if request.serialized_transaction.is_empty() {
        return Err((
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse {
                error: "invalid_transaction".to_string(),
                message: "Serialized transaction cannot be empty".to_string(),
            }),
        ));
    }

    // Simulate different scenarios based on invoice_id for testing
    if invoice_id.contains("paid") {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invoice_already_paid".to_string(),
                message: "Invoice has already been paid".to_string(),
            }),
        ));
    }

    if invoice_id.contains("expired") {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invoice_expired".to_string(),
                message: "Invoice has expired and cannot accept payments".to_string(),
            }),
        ));
    }

    // Simulate underpayment detection
    let payment_amount = request.amount.parse::<f64>().unwrap();
    if payment_amount < 0.001 { // Minimum payment threshold for demo
        return Err((
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse {
                error: "underpayment_detected".to_string(),
                message: "Payment amount is below the required minimum".to_string(),
            }),
        ));
    }

    // Create mock payment
    let payment = Payment {
        payment_id: format!("pay_{}", Uuid::new_v4().to_string().split('-').next().unwrap()),
        invoice_id: invoice_id.clone(),
        status: PaymentStatus::Accepted,
        asset: request.asset,
        amount: convert_money_from_string(request.amount).map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_amount_format".to_string(),
                    message: "Amount format is invalid".to_string(),
                }),
            )
        })?,
        received_at: Utc::now(),
        tx_id: format!("0xbolt{}", &request.serialized_transaction[..8]),
    };

    tracing::info!(
        "Payment {} submitted for invoice {} with amount {} {:?}",
        payment.payment_id,
        invoice_id,
        payment.amount,
        payment.asset
    );

    Ok(Json(PaymentResponse::from(payment)))
}

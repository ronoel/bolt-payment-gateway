// src/handlers/payments.rs
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};

use crate::{models::{
    convert_string_to_object_id, ErrorResponse, Invoice, InvoiceStatus, Payment, PaymentResponse, PaymentStatus, SubmitPaymentRequest
}, shared::calculate_satoshis_for_usd_with_spread, AppState};

/// Submit a payment transaction for an invoice
pub async fn submit_payment(
    State(app_state): State<AppState>,
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

    let object_id = convert_string_to_object_id(&invoice_id)?;

    let invoice = match app_state.invoice_repository.find_by_id(&object_id).await {
        Ok(Some(invoice)) => invoice,
        Ok(None) => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "invoice_not_found".to_string(),
                    message: "Invoice not found".to_string(),
                }),
            ));
        }
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to retrieve invoice".to_string(),
                }),
            ));
        }
    };

    if invoice.status == crate::models::InvoiceStatus::Paid || invoice.status == crate::models::InvoiceStatus::Settled {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invoice_already_paid".to_string(),
                message: "Invoice has already been paid".to_string(),
            }),
        ));
    }

    if invoice.status == crate::models::InvoiceStatus::Expired {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invoice_expired".to_string(),
                message: "Invoice has expired".to_string(),
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

    let amount = request.amount.parse::<u128>().map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_amount_format".to_string(),
                message: "Amount format is invalid".to_string(),
            }),
        )
    })?;


    // Get quote
    // Get Bitcoin price from QuoteService
    let btc_price_usd_cents = app_state
        .quote_service
        .get_bitcoin_price()
        .await
        .map_err(|e| {
            tracing::error!("Failed to get Bitcoin price: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "price_fetch_error".to_string(),
                    message: "Failed to fetch current Bitcoin price".to_string(),
                }),
            )
        })?;

    let spread_percentage = 50 as u128; // 0.50% minimal spread accepted
    let satoshis_with_spread = calculate_satoshis_for_usd_with_spread(invoice.amount, btc_price_usd_cents, spread_percentage);

    tracing::info!("Calculated satoshis with spread: {}", satoshis_with_spread);
    tracing::info!("Payment amount in satoshis: {}", amount);

    if amount < satoshis_with_spread {
        return Err((
            StatusCode::PRECONDITION_FAILED,
            Json(ErrorResponse {
                error: "underpayment_detected".to_string(),
                message: format!("Payment amount is below the required minimum of {} satoshis", satoshis_with_spread),
            }),
        ));
    }


    let payment: Payment = Payment::new(invoice.id, request.asset, amount);

    // Save payment to database with constraint checking
    if let Err(error_msg) = app_state.payment_repository.create(&payment).await {
        if error_msg.to_string().contains("duplicate key") || error_msg.to_string().contains("E11000") {
            return Err((
                StatusCode::CONFLICT,
                Json(ErrorResponse {
                    error: "payment_already_exists".to_string(),
                    message: "Payment already exists or being processed".to_string(),
                }),
            ));
        } else {
            tracing::error!("Failed to save payment: {}", error_msg);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to save payment".to_string(),
                }),
            ));
        }
    }

    // NEXT: 
    // 1 - Broadcast the transaction validating it. (receive the transaction ID and sender address)
    let response = app_state.bolt_protocol_service.broadcast_transaction(
        request.serialized_transaction, 
        amount, 
        "ST3QZNX3CGT6V7PE1PBK17FCRK1TP1AT02W1N0YJF".to_string()
    ).await;
    
    let bolt_response = match response {
        Ok(res) => res,
        Err(e) => {
            tracing::error!("Failed to broadcast transaction: {:?}", e);
            
            // Update payment status to Rejected
            if let Err(update_err) = app_state.payment_repository.update_status(&payment.id, PaymentStatus::Rejected).await {
                tracing::error!("Failed to update payment status to Rejected: {}", update_err);
            }
            
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "transaction_broadcast_error".to_string(),
                    message: "Failed to broadcast transaction".to_string(),
                }),
            ));
        }
    };

    let payment_confirmed = match app_state.payment_repository.confirm(&payment.id, &bolt_response.txid).await {
        Ok(confirmed_payment) => confirmed_payment.ok_or_else(|| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "payment_confirmation_error".to_string(),
                    message: "Failed to confirm payment".to_string(),
                }),
            )
        })?,
        Err(e) => {
            tracing::error!("Failed to confirm payment: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "payment_confirmation_error".to_string(),
                    message: "Failed to confirm payment".to_string(),
                }),
            ));
        }
    };

    match app_state.invoice_repository.update_status(&invoice.id.to_string(), InvoiceStatus::Paid).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Failed to update invoice status to Paid: {}", e);
        }
    }

    tracing::info!(
        "Payment {} submitted for invoice {} with amount {} and tx_id {} {:?}",
        payment.id,
        payment.invoice_id,
        payment.amount,
        bolt_response.txid,
        payment.asset
    );

    Ok(Json(PaymentResponse::from(payment_confirmed)))
}

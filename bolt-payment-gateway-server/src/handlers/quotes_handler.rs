// src/handlers/quotes_handler.rs
use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;

use crate::{shared::calculate_satoshis_for_usd_with_spread, AppState};
use crate::models::{
    ErrorResponse, QuoteQuery, QuoteResponse, convert_money_from_string, format_money_amount,
};

/// Get a conversion quote
pub async fn get_quote(
    State(app_state): State<AppState>,
    Query(query): Query<QuoteQuery>,
) -> Result<Json<QuoteResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate supported assets
    if query.from.to_uppercase() != "BTC" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "unsupported_from_asset".to_string(),
                message: format!(
                    "From asset '{}' is not supported at this time. Only 'BTC' is supported.",
                    query.from
                ),
            }),
        ));
    }

    if query.to.to_uppercase() != "USD" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "unsupported_to_asset".to_string(),
                message: format!(
                    "To asset '{}' is not supported at this time. Only 'USD' is supported.",
                    query.to
                ),
            }),
        ));
    }

    let usd_amount = convert_money_from_string(query.to_amount.clone()).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_amount".to_string(),
                message: "to_amount must be a valid number".to_string(),
            }),
        )
    })?;

    if usd_amount <= 0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_amount".to_string(),
                message: "to_amount must be positive".to_string(),
            }),
        ));
    }

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

    let spread_percentage = 10 as u128; // 1.0% spread
    let satoshis_with_spread = calculate_satoshis_for_usd_with_spread(usd_amount, btc_price_usd_cents, spread_percentage);

    Ok(Json(QuoteResponse {
        from_asset: query.from.to_uppercase(),
        to_asset: query.to.to_uppercase(),
        from_amount: satoshis_with_spread.to_string(), // Amount in satoshis the user needs to pay
        to_amount: query.to_amount,                    // USD amount the user wants to pay
        unit_price: format_money_amount(btc_price_usd_cents), // Price per BTC in USD (without spread)
        spread: format!("{:.2}%", spread_percentage/10),                     // Spread percentage
        refreshed_at: Utc::now(),
    }))
}

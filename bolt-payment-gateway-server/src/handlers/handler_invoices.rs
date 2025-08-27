// src/handlers/invoices.rs
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use bson::oid::ObjectId;
use chrono::Utc;
use uuid::Uuid;

use crate::models::{
    convert_money_from_string, CreateInvoiceRequest, ErrorResponse, Invoice, InvoiceResponse, InvoiceStatus, ListInvoicesQuery, ListInvoicesResponse
};
use crate::AppState;

/// Create a new invoice for a merchant
pub async fn create_invoice(
    State(app_state): State<AppState>,
    Path(wallet_address): Path<String>,
    Json(request): Json<CreateInvoiceRequest>,
) -> Result<Json<InvoiceResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate amount
    if request.amount.parse::<f64>().is_err() || request.amount.parse::<f64>().unwrap() <= 0.0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_amount".to_string(),
                message: "Amount must be a positive number".to_string(),
            }),
        ));
    }

    // Create invoice
    let invoice = Invoice {
        id: ObjectId::new(),
        wallet_address: wallet_address.clone(),
        status: InvoiceStatus::Created,
        amount: convert_money_from_string(request.amount).map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_amount_format".to_string(),
                    message: "Amount format is invalid".to_string(),
                }),
            )
        })?,
        settlement_asset: request.settlement_asset,
        merchant_order_id: request.merchant_order_id,
        created_at: Utc::now(),
        expires_at: Some(Utc::now() + chrono::Duration::hours(24)), // 24 hour expiry
    };

    // Save to database
    if let Err(e) = app_state.invoice_repository.create(&invoice).await {
        tracing::error!("Failed to create invoice in database: {}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "database_error".to_string(),
                message: "Failed to create invoice".to_string(),
            }),
        ));
    }

    tracing::info!(
        "Created invoice {} for merchant {} with amount {} {}",
        invoice.id.to_string(),
        wallet_address,
        invoice.amount,
        format!("{:?}", invoice.settlement_asset)
    );

    Ok(Json(InvoiceResponse::from(invoice)))
}

/// Get a specific invoice by ID
pub async fn get_invoice(
    State(app_state): State<AppState>,
    Path(invoice_id): Path<String>,
) -> Result<Json<InvoiceResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Try to find the invoice in the database
    match app_state.invoice_repository.find_by_id(&invoice_id).await {
        Ok(Some(invoice)) => {
            tracing::info!("Retrieved invoice {} from database", invoice_id);
            Ok(Json(InvoiceResponse::from(invoice)))
        }
        Ok(None) => {
            tracing::warn!("Invoice {} not found", invoice_id);
            Err((
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "invoice_not_found".to_string(),
                    message: "Invoice not found".to_string(),
                }),
            ))
        }
        Err(e) => {
            tracing::error!("Database error when retrieving invoice {}: {}", invoice_id, e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to retrieve invoice".to_string(),
                }),
            ))
        }
    }
}

/// List invoices for a merchant with optional filtering
pub async fn list_invoices(
    State(app_state): State<AppState>,
    Path(wallet_address): Path<String>,
    Query(query): Query<ListInvoicesQuery>,
) -> Result<Json<ListInvoicesResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate pagination parameters
    if query.limit > 100 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_limit".to_string(),
                message: "Limit cannot exceed 100".to_string(),
            }),
        ));
    }

    // Retrieve invoices from database
    let mut invoices = match app_state.invoice_repository.find_by_merchant(&wallet_address).await {
        Ok(invoices) => invoices,
        Err(e) => {
            tracing::error!("Database error when retrieving invoices for merchant {}: {}", wallet_address, e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to retrieve invoices".to_string(),
                }),
            ));
        }
    };

    // Apply filters
    if let Some(status) = query.status {
        invoices.retain(|inv| inv.status == status);
    }

    if let Some(merchant_order_id) = &query.merchant_order_id {
        invoices.retain(|inv| inv.merchant_order_id == *merchant_order_id);
    }

    if let Some(from_date) = query.from_date {
        invoices.retain(|inv| inv.created_at >= from_date);
    }

    if let Some(to_date) = query.to_date {
        invoices.retain(|inv| inv.created_at <= to_date);
    }

    let total = invoices.len();
    
    // Apply pagination
    let start = query.offset;
    let end = (start + query.limit).min(total);
    let paginated_invoices = if start < total {
        invoices[start..end].to_vec()
    } else {
        vec![]
    };

    tracing::info!(
        "Listed {} invoices for merchant {} (total: {}, offset: {}, limit: {})",
        paginated_invoices.len(),
        wallet_address,
        total,
        query.offset,
        query.limit
    );

    let response = ListInvoicesResponse {
        items: paginated_invoices.into_iter().map(InvoiceResponse::from).collect(),
        total,
        limit: query.limit,
        offset: query.offset,
    };

    Ok(Json(response))
}

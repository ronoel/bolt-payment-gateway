// src/handlers/invoices.rs
use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use uuid::Uuid;

use crate::models::{
    convert_money_from_string, CreateInvoiceRequest, ErrorResponse, Invoice, InvoiceResponse, InvoiceStatus, ListInvoicesQuery, ListInvoicesResponse, SettlementAsset
};

/// Create a new invoice for a merchant
pub async fn create_invoice(
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

    // Create mock invoice
    let invoice = Invoice {
        invoice_id: format!("inv_{}", Uuid::new_v4().to_string().split('-').next().unwrap()),
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

    tracing::info!(
        "Created invoice {} for merchant {} with amount {} {}",
        invoice.invoice_id,
        wallet_address,
        invoice.amount,
        format!("{:?}", invoice.settlement_asset)
    );

    Ok(Json(InvoiceResponse::from(invoice)))
}

/// Get a specific invoice by ID
pub async fn get_invoice(
    Path(invoice_id): Path<String>,
) -> Result<Json<InvoiceResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Mock invoice data - in a real implementation, this would query the database
    let mock_invoice = Invoice {
        invoice_id: invoice_id.clone(),
        status: InvoiceStatus::Created,
        amount: 4990,
        settlement_asset: SettlementAsset::USD,
        merchant_order_id: "ORD-12345".to_string(),
        created_at: Utc::now() - chrono::Duration::minutes(30),
        expires_at: Some(Utc::now() + chrono::Duration::hours(23) + chrono::Duration::minutes(30)),
    };

    // Simulate not found case for demonstration
    if invoice_id.starts_with("notfound") {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "invoice_not_found".to_string(),
                message: "Invoice not found".to_string(),
            }),
        ));
    }

    tracing::info!("Retrieved invoice {}", invoice_id);
    Ok(Json(InvoiceResponse::from(mock_invoice)))
}

/// List invoices for a merchant with optional filtering
pub async fn list_invoices(
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

    // Create mock invoices
    let mut mock_invoices = vec![
        Invoice {
            invoice_id: "inv_001".to_string(),
            status: InvoiceStatus::Paid,
            amount: 4990,
            settlement_asset: SettlementAsset::USD,
            merchant_order_id: "ORD-12345".to_string(),
            created_at: Utc::now() - chrono::Duration::hours(2),
            expires_at: Some(Utc::now() + chrono::Duration::hours(22)),
        },
        Invoice {
            invoice_id: "inv_002".to_string(),
            status: InvoiceStatus::Created,
            amount: 12999,
            settlement_asset: SettlementAsset::USD,
            merchant_order_id: "ORD-12346".to_string(),
            created_at: Utc::now() - chrono::Duration::hours(1),
            expires_at: Some(Utc::now() + chrono::Duration::hours(23)),
        },
        Invoice {
            invoice_id: "inv_003".to_string(),
            status: InvoiceStatus::Expired,
            amount: 7550,
            settlement_asset: SettlementAsset::BRL,
            merchant_order_id: "ORD-12347".to_string(),
            created_at: Utc::now() - chrono::Duration::days(2),
            expires_at: Some(Utc::now() - chrono::Duration::days(1)),
        },
    ];

    // Apply filters
    if let Some(status) = query.status {
        mock_invoices.retain(|inv| inv.status == status);
    }

    if let Some(merchant_order_id) = &query.merchant_order_id {
        mock_invoices.retain(|inv| inv.merchant_order_id == *merchant_order_id);
    }

    if let Some(from_date) = query.from_date {
        mock_invoices.retain(|inv| inv.created_at >= from_date);
    }

    if let Some(to_date) = query.to_date {
        mock_invoices.retain(|inv| inv.created_at <= to_date);
    }

    let total = mock_invoices.len();
    
    // Apply pagination
    let start = query.offset;
    let end = (start + query.limit).min(total);
    let paginated_invoices = if start < total {
        mock_invoices[start..end].to_vec()
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

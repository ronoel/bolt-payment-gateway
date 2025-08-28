// src/api/v1/routes.rs
use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::{invoices_handler, payments_handler, quotes_handler};
use crate::AppState;

pub fn create_routes() -> Router<AppState> {
    Router::new()
        // Invoice routes
        .route(
            "/merchants/{wallet_address}/invoices",
            post(invoices_handler::create_invoice)
                .get(invoices_handler::list_invoices),
        )
        .route("/invoices/{invoice_id}", get(invoices_handler::get_invoice))
        // Payment routes
        .route(
            "/invoices/{invoice_id}/payments/submit",
            post(payments_handler::submit_payment),
        )
        // Quote routes
        .route("/quotes", get(quotes_handler::get_quote))
}
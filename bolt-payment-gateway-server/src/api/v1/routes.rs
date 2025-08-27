// src/api/v1/routes.rs
use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::{handler_invoices, handler_payments};

pub fn create_routes() -> Router {
    Router::new()
        // Invoice routes
        .route(
            "/merchants/{wallet_address}/invoices",
            post(handler_invoices::create_invoice)
                .get(handler_invoices::list_invoices),
        )
        .route("/invoices/{invoice_id}", get(handler_invoices::get_invoice))
        // Payment routes
        .route(
            "/invoices/{invoice_id}/payments/submit",
            post(handler_payments::submit_payment),
        )
}
// src/main.rs
mod api;
mod database;
mod handlers;
mod models;
mod services;
mod shared;

use axum::{routing::get, Router};
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber;
use std::env;

use database::{MongoDBClient, InvoiceRepository, PaymentRepository};
use services::quote_service::QuoteService;
use services::bolt_protocol_service::BoltProtocolService;

#[derive(Clone)]
pub struct AppState {
    pub invoice_repository: InvoiceRepository,
    pub payment_repository: PaymentRepository,
    pub quote_service: QuoteService,
    pub bolt_protocol_service: BoltProtocolService,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Get MongoDB connection string from environment or use default
    let mongodb_uri = env::var("MONGODB_URI")
        .unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    
    let database_name = env::var("DATABASE_NAME")
        .unwrap_or_else(|_| "bolt_payment_gateway".to_string());

    // Initialize MongoDB client
    let mongodb_client = MongoDBClient::new(&mongodb_uri, &database_name)
        .await
        .expect("Failed to connect to MongoDB");

    // Initialize repositories
    let invoice_repository = InvoiceRepository::new(mongodb_client.get_database());
    let payment_repository = PaymentRepository::new(mongodb_client.get_database());

    // Create indexes for payments
    if let Err(e) = payment_repository.create_indexes().await {
        eprintln!("Failed to create payment indexes: {}", e);
        std::process::exit(1);
    }

    // Initialize services
    let quote_service = QuoteService::new();
    let bolt_protocol_service = BoltProtocolService::new();

    // Create application state
    let app_state = AppState {
        invoice_repository,
        payment_repository,
        quote_service,
        bolt_protocol_service,
    };

    // Build our application with routes
    let routes = api::v1::routes::create_routes();
    
    let app = Router::new()
        .route("/health", get(health_check))
        .nest("/v1", routes)
        .with_state(app_state)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive()),
        );

    // Run the server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("🚀 Server running on http://0.0.0.0:3000");
    println!("📊 Connected to MongoDB at: {}", mongodb_uri);
    
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "OK"
}

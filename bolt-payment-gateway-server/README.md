# Bolt Payment Gateway Server

A Rust-based payment gateway API server with MongoDB integration.

## Features

- **Invoice Management**: Create, retrieve, and list invoices with MongoDB persistence
- **RESTful API**: Clean REST endpoints following OpenAPI specification
- **MongoDB Integration**: Persistent storage with repository pattern
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Logging**: Structured logging with tracing
- **CORS Support**: Cross-origin resource sharing enabled

## Prerequisites

- Rust 1.75+ (edition 2024)
- MongoDB 4.4+

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017`)
- `DATABASE_NAME` - Database name (default: `bolt_payment_gateway`)

## Quick Start

1. **Start MongoDB** (if using local instance):
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install MongoDB locally
   # https://docs.mongodb.com/manual/installation/
   ```

2. **Set environment variables** (optional):
   ```bash
   export MONGODB_URI="mongodb://localhost:27017"
   export DATABASE_NAME="bolt_payment_gateway"
   ```

3. **Run the server**:
   ```bash
   cargo run
   ```

The server will start on `http://0.0.0.0:3000`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Invoice Management
- `POST /v1/merchants/{wallet_address}/invoices` - Create a new invoice
- `GET /v1/merchants/{wallet_address}/invoices` - List invoices for a merchant
- `GET /v1/invoices/{invoice_id}` - Get a specific invoice

### Example: Create Invoice

```bash
curl -X POST "http://localhost:3000/v1/merchants/wallet123/invoices" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "49.90",
    "settlement_asset": "USD",
    "merchant_order_id": "ORD-12345"
  }'
```

## Database Schema

### Invoices Collection

```javascript
{
  "_id": ObjectId,
  "invoice_id": String,        // Unique invoice identifier
  "wallet_address": String,    // Merchant wallet address
  "status": String,            // "created", "paid", "expired", "settled"
  "amount": NumberLong,        // Amount in cents (e.g., 4990 = $49.90)
  "settlement_asset": String,  // "USD" or "BRL"
  "merchant_order_id": String, // Merchant's order reference
  "created_at": Date,          // RFC3339 timestamp
  "expires_at": Date           // Optional expiration timestamp
}
```

## Development

### Project Structure

```
src/
├── main.rs                 # Application entry point
├── api/
│   └── v1/
│       └── routes.rs      # API route definitions
├── database/
│   ├── mod.rs             # Database module exports
│   ├── mongodb.rs         # MongoDB client setup
│   └── repositories/
│       └── invoice_repository.rs  # Invoice data access layer
├── handlers/
│   ├── handler_invoices.rs        # Invoice endpoint handlers
│   └── handler_payments.rs        # Payment endpoint handlers (placeholder)
└── models/
    ├── invoice.rs         # Invoice entity model
    ├── payment.rs         # Payment entity model
    └── dto.rs             # Request/Response DTOs
```

### Best Practices Implemented

1. **Repository Pattern**: Database operations are abstracted through repository interfaces
2. **Error Handling**: Comprehensive error types with proper HTTP status codes
3. **Input Validation**: Request validation with meaningful error messages
4. **Logging**: Structured logging for debugging and monitoring
5. **Environment Configuration**: Configurable database connections
6. **Type Safety**: Strong typing with Rust's type system and serde serialization

### Testing

```bash
# Run tests
cargo test

# Run with logging
RUST_LOG=debug cargo test

# Check code format
cargo fmt --check

# Run clippy for linting
cargo clippy
```

# Bolt Payment Gateway

**Bolt Payment Gateway** is a comprehensive payment solution built on Bitcoin L2 (**Stacks**) powered by the **Bolt Protocol**. It enables **instant-confirmed sBTC payments** with **fees paid in sBTC** (no STX). Issue invoices and payment links/QRs with **real-time quotes** and optional **USD-locked settlement** at pay time. Ships with an **OpenAPI** and a lightweight **dashboard** to create and track charges, integrating with Stacks-compatible wallets.

## 🌐 Live Demo

- **🚀 Try it now on Testnet**: [https://test.boltproto.org/tools/payment-gateway/](https://test.boltproto.org/tools/payment-gateway/)
- **📹 Video Demo**: [Watch the solution in action](https://youtu.be/6YEIhXs7Bc4)

## 🚀 Features

- **Instant sBTC Payments**: Lightning-fast transactions powered by Bolt Protocol
- **Multi-Asset Support**: Accept payments in sBTC and USDT
- **USD Settlement**: Lock in USD prices at invoice creation time
- **Real-time Quotes**: Dynamic BTC/USD pricing with configurable spreads
- **Web Dashboard**: User-friendly interface for invoice management
- **Wallet Integration**: Compatible with Stacks ecosystem wallets
- **MongoDB Storage**: Reliable data persistence

## 🏗️ Architecture

This repository contains two main components:

### Backend API Server (`bolt-payment-gateway-server/`)
- **Language**: Rust
- **Framework**: Axum web framework
- **Database**: MongoDB
- **Features**: RESTful API, real-time quotes, payment processing

### Frontend Dashboard (`bolt-payment-gateway-ux/`)
- **Language**: TypeScript
- **Framework**: Angular 20
- **Features**: Invoice management, payment tracking, merchant dashboard

## 📚 API Documentation

Complete API documentation is available at:
**[Postman Documentation](https://documenter.getpostman.com/view/281567/2sB3Hkpzji)**

### Base URL
```
https://test.boltproto.org/apipaymentgateway/v1
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/merchants/{wallet_address}/invoices` | Create a new invoice |
| `GET` | `/merchants/{wallet_address}/invoices` | List merchant invoices |
| `GET` | `/invoices/{invoice_id}` | Retrieve specific invoice |
| `POST` | `/invoices/{invoice_id}/payments/submit` | Submit payment |
| `GET` | `/quotes` | Get BTC/USD conversion quote |

## 🛠️ Quick Start

### Prerequisites

- **Rust** (latest stable version)
- **Node.js** (v18+ for frontend)
- **Docker** (optional, for containerization)
- **MongoDB** (for data persistence)

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd bolt-payment-gateway/bolt-payment-gateway-server
   ```

2. **Set environment variables**:
   ```bash
   export MONGODB_URI="mongodb://localhost:27017"
   export DATABASE_NAME="bolt_payment_gateway"
   ```

3. **Build and run**:
   ```bash
   cargo build
   cargo run
   ```

The server will start on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd bolt-payment-gateway-ux
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

The dashboard will be available at `http://localhost:4200`


## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `bolt_payment_gateway` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Logging level | `info` |

### Supported Assets

- **Payment Assets**: `sBTC`, `USDT`
- **Settlement Assets**: `USD`, `BRL`

## 📈 Features in Detail

### Invoice Management
- Create invoices with USD/BRL settlement
- Automatic expiration (2 minutes default)
- Status tracking: `created`, `paid`, `expired`, `settled`
- Merchant order ID for reconciliation

### Payment Processing
- Multi-asset payment support
- Real-time payment validation
- Automatic underpayment detection
- Transaction broadcasting

### Quote System
- Real-time BTC/USD pricing
- Configurable spread (1% default)
- Satoshi-precision calculations
- Price refresh timestamps

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd bolt-payment-gateway-server
cargo test

# Frontend tests
cd bolt-payment-gateway-ux
npm test
```

### Code Quality
```bash
# Rust formatting and linting
cargo fmt
cargo clippy

# Angular linting
cd bolt-payment-gateway-ux
ng lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions and support:
- **API Documentation**: [Postman Collection](https://documenter.getpostman.com/view/281567/2sB3Hkpzji)
- **Issues**: GitHub Issues
- **Community**: Stacks Discord
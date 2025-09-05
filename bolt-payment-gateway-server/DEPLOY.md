# Bolt Payment Gateway Server

## Overview
The Bolt Payment Gateway Server is a Rust-based web server built using the Axum framework. It provides a robust and efficient way to handle payment processing and related functionalities.

## Prerequisites
- Rust (latest stable version)
- Docker (for containerization)
- Kubernetes (for deployment on GCP)
- MongoDB (for data persistence)

## Setup Instructions

### Local Development
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bolt-payment-gateway-server
   ```

2. Set environment variables:
   ```bash
   export MONGODB_URI="mongodb://localhost:27017"
   export DATABASE_NAME="bolt_payment_gateway-dev"
   ```

3. Build the project:
   ```bash
   cargo build
   ```

4. Run the application:
   ```bash
   cargo run
   ```

### Docker Setup

To build and publish image

```bash
./publish.sh 0.0.2-staging staging
```

To build and run the application in a Docker container:

1. Build the Docker image:
   ```bash
   docker build -t bolt-payment-gateway-server .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 4000:4000 \
     -e MONGODB_URI="mongodb://host.docker.internal:27017" \
     -e DATABASE_NAME="bolt_payment_gateway" \
     bolt-payment-gateway-server
   ```

### Kubernetes Deployment
Deploy to GCP Kubernetes:

1. Build and push to container registry:
   ```bash
   docker build -t southamerica-east1-docker.pkg.dev/smiling-stock-373320/pulseb-containers/bolt-payment-gateway-server:latest .
   docker push southamerica-east1-docker.pkg.dev/smiling-stock-373320/pulseb-containers/bolt-payment-gateway-server:latest
   ```

2. Create MongoDB connection secret:
   ```bash
   kubectl create secret generic bolt-payment-gateway-secrets \
     --from-literal=mongodb-uri="mongodb://your-mongodb-connection-string"
   ```

3. Apply the Kubernetes manifests:
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

Expose
   ```bash
kubectl expose deployment bolt-payment-gateway-server-staging --target-port=4000 --type=NodePort
   ```

## Usage
- **Local**: `http://localhost:4000`
- **Health Check**: `http://localhost:4000/health`
- **API Base**: `http://localhost:4000/v1`

## Development vs Production Builds

### Development
```bash
cargo build          # Debug build - faster compilation, slower runtime
cargo run            # Run debug version
```

### Production
```bash
cargo build --release  # Release build - slower compilation, faster runtime
cargo run --release    # Run optimized version
```

**Always use `--release` for production deployments!**

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.
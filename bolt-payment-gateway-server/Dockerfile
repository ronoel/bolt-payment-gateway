# ---- Stage 1: Builder ----
FROM rust:1-slim-bookworm as builder

# Install necessary build dependencies
RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy manifest files first to leverage cache
COPY Cargo.toml ./
COPY Cargo.loc[k] ./

# Create a dummy src/main.rs to compile only dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm src/main.rs

# Now copy the real code and compile
COPY src ./src
RUN cargo build --release

# ---- Stage 2: Final ----
FROM gcr.io/distroless/cc-debian12

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /usr/src/app/target/release/bolt-payment-gateway-server .

# Expose the correct port
EXPOSE 4000

# Environment variables with default values
ENV MONGODB_URI="mongodb://localhost:27017"
ENV DATABASE_NAME="bolt_payment_gateway"

# Command to run
CMD ["./bolt-payment-gateway-server"]
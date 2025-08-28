use reqwest;
use serde::Deserialize;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::OnceCell;

#[derive(Debug, Deserialize)]
struct BinanceAvgPriceResponse {
    mins: u32,
    price: String,
    #[serde(rename = "closeTime")]
    close_time: u64,
}

#[derive(Debug, Clone)]
struct CachedPrice {
    price: f64,
    timestamp: Instant,
}

#[derive(Debug, Clone)]
pub struct QuoteService {
    base_url: String,
    client: reqwest::Client,
    cached_bitcoin_price: Arc<Mutex<Option<CachedPrice>>>,
    cache_expiry_duration: Duration,
    ongoing_request: Arc<Mutex<Option<Arc<OnceCell<Result<f64, reqwest::Error>>>>>>,
}

impl QuoteService {
    pub fn new() -> Self {
        Self {
            base_url: "https://api.binance.com/api/v3".to_string(),
            client: reqwest::Client::new(),
            cached_bitcoin_price: Arc::new(Mutex::new(None)),
            cache_expiry_duration: Duration::from_secs(30), // 30 seconds as requested
            ongoing_request: Arc::new(Mutex::new(None)),
        }
    }

    /// Get the current average Bitcoin price
    /// Returns the current average Bitcoin price in USDT
    pub async fn get_bitcoin_price(&self) -> Result<f64, Box<dyn std::error::Error + Send + Sync>> {
        let now = Instant::now();

        // Check if we have a cached price and it's not expired
        {
            let cached = self.cached_bitcoin_price.lock().unwrap();
            if let Some(cached_price) = &*cached {
                if now.duration_since(cached_price.timestamp) < self.cache_expiry_duration {
                    let expires_in =
                        self.cache_expiry_duration - now.duration_since(cached_price.timestamp);
                    println!(
                        "Using cached BTC price data, expires in {} seconds",
                        expires_in.as_secs()
                    );
                    return Ok(cached_price.price);
                }
            }
        }

        // Check if there's already an ongoing API request
        let ongoing_cell = {
            let mut ongoing = self.ongoing_request.lock().unwrap();
            if let Some(existing_cell) = &*ongoing {
                println!("Reusing existing BTC price API request");
                existing_cell.clone()
            } else {
                println!("Making new BTC average price API request");
                let new_cell = Arc::new(OnceCell::new());
                *ongoing = Some(new_cell.clone());
                new_cell
            }
        };

        // Get or create the future for the API request
        let result = ongoing_cell
            .get_or_try_init(|| async { self.fetch_bitcoin_price().await })
            .await;

        // Clean up the ongoing request after a delay to prevent race conditions
        let ongoing_request_clone = self.ongoing_request.clone();
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_secs(1)).await;
            let mut ongoing = ongoing_request_clone.lock().unwrap();
            *ongoing = None;
        });

        match result {
            Ok(price) => {
                // Update the cache
                let mut cached = self.cached_bitcoin_price.lock().unwrap();
                *cached = Some(CachedPrice {
                    price: *price,
                    timestamp: Instant::now(),
                });
                Ok(*price)
            }
            Err(e) => Err(Box::new(e.clone())),
        }
    }

    async fn fetch_bitcoin_price(&self) -> Result<f64, reqwest::Error> {
        let url = format!("{}/avgPrice", self.base_url);
        let response = self
            .client
            .get(&url)
            .query(&[("symbol", "BTCUSDT")])
            .send()
            .await?;

        let avg_price_response: BinanceAvgPriceResponse = response.json().await?;
        let price = avg_price_response.price.parse::<f64>().map_err(|e| {
            reqwest::Error::from(std::io::Error::new(std::io::ErrorKind::InvalidData, e))
        })?;

        Ok(price)
    }

    /// Get the remaining time in seconds until the cache expires
    /// Returns the number of seconds until cache expiry, or 0 if cache is expired/empty
    pub fn get_cache_expiry_time(&self) -> u64 {
        let cached = self.cached_bitcoin_price.lock().unwrap();

        if let Some(cached_price) = &*cached {
            let now = Instant::now();
            let expires_at = cached_price.timestamp + self.cache_expiry_duration;

            if expires_at <= now {
                return 0;
            }

            return expires_at.duration_since(now).as_secs();
        }

        0
    }

    /// Clear the cached Bitcoin price, forcing the next call to fetch fresh data
    pub fn clear_cache(&self) {
        let mut cached = self.cached_bitcoin_price.lock().unwrap();
        *cached = None;

        let mut ongoing = self.ongoing_request.lock().unwrap();
        *ongoing = None;
    }
}

impl Default for QuoteService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn test_quote_service_creation() {
        let service = QuoteService::new();
        assert_eq!(service.get_cache_expiry_time(), 0);
    }

    #[tokio::test]
    async fn test_clear_cache() {
        let service = QuoteService::new();
        service.clear_cache();
        assert_eq!(service.get_cache_expiry_time(), 0);
    }
}

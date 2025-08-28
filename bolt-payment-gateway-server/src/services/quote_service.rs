use reqwest;
use serde::Deserialize;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use crate::models::convert_money_from_string;

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct BinanceAvgPriceResponse {
    mins: u32,
    price: String,
    #[serde(rename = "closeTime")]
    close_time: u64,
}

#[derive(Debug, Clone)]
struct CachedPrice {
    price: u128,
    timestamp: Instant,
}

#[derive(Debug, Clone)]
pub struct QuoteService {
    base_url: String,
    client: reqwest::Client,
    cached_bitcoin_price: Arc<Mutex<Option<CachedPrice>>>,
    cache_expiry_duration: Duration,
}

impl QuoteService {
    pub fn new() -> Self {
        tracing::info!("Initializing QuoteService with Binance API base URL: https://api.binance.com/api/v3");
        Self {
            base_url: "https://api.binance.com/api/v3".to_string(),
            client: reqwest::Client::new(),
            cached_bitcoin_price: Arc::new(Mutex::new(None)),
            cache_expiry_duration: Duration::from_secs(30), // 30 seconds as requested
        }
    }

    /// Get the current average Bitcoin price
    /// Returns the current average Bitcoin price in USDT (cents)
    pub async fn get_bitcoin_price(&self) -> Result<u128, Box<dyn std::error::Error + Send + Sync>> {
        let now = Instant::now();

        // Check if we have a cached price and it's not expired
        {
            let cached = self.cached_bitcoin_price.lock().unwrap();
            if let Some(cached_price) = &*cached {
                if now.duration_since(cached_price.timestamp) < self.cache_expiry_duration {
                    let expires_in =
                        self.cache_expiry_duration - now.duration_since(cached_price.timestamp);
                    tracing::info!(
                        "Using cached BTC price: ${:.2}, expires in {} seconds",
                        cached_price.price,
                        expires_in.as_secs()
                    );
                    return Ok(cached_price.price);
                }
                tracing::debug!("Cache expired for BTC price, fetching fresh data");
            } else {
                tracing::debug!("No cached BTC price available, fetching fresh data");
            }
        }

        // Fetch fresh price
        tracing::info!("Fetching fresh BTC price from Binance API");
        let price = self.fetch_bitcoin_price().await.map_err(|e| {
            tracing::error!("Failed to fetch Bitcoin price from API: {}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

        // Update the cache
        {
            let mut cached = self.cached_bitcoin_price.lock().unwrap();
            *cached = Some(CachedPrice {
                price,
                timestamp: Instant::now(),
            });
            tracing::info!("Updated BTC price cache with new value: ${:.2}", price);
        }

        Ok(price)
    }

    async fn fetch_bitcoin_price(&self) -> Result<u128, reqwest::Error> {
        let url = format!("{}/avgPrice", self.base_url);
        let query_params = [("symbol", "BTCUSDT")];

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .send()
            .await;

        match response {
            Ok(resp) => {
                tracing::info!(
                    "Binance API request successful. Status: {}, Headers: {:?}",
                    resp.status(),
                    resp.headers()
                );

                let json_result = resp.json::<BinanceAvgPriceResponse>().await;
                match json_result {
                    Ok(avg_price_response) => {
                        tracing::info!(
                            "Binance API response parsed successfully: price={}, mins={}, close_time={}",
                            avg_price_response.price,
                            avg_price_response.mins,
                            avg_price_response.close_time
                        );

                        // Parse the price string to u128
                        let price = convert_money_from_string(avg_price_response.price).map_err(|parse_err| {
                            tracing::error!("Failed to convert price string to u128: {:?}", parse_err);
                            panic!("Failed to parse price from Binance API - invalid number format");
                        })?;

                        Ok(price)
                    }
                    Err(json_err) => {
                        tracing::error!("Failed to parse Binance API JSON response: {}", json_err);
                        Err(json_err)
                    }
                }
            }
            Err(req_err) => {
                tracing::error!(
                    "Binance API request failed for URL {} with params {:?}: {}",
                    url,
                    query_params,
                    req_err
                );
                Err(req_err)
            }
        }
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
        tracing::info!("Bitcoin price cache cleared manually");
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

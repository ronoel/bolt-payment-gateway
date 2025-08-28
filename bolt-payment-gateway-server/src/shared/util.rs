/// Calculate the amount of satoshis needed for a given USD amount
///
/// # Arguments
/// * `usd_cents` - The target USD amount in cents
/// * `btc_price_usd_cents` - The current BTC price in USD cents
///
/// # Returns
/// The amount of satoshis needed
///
/// # Example
/// ```
/// let satoshis = calculate_satoshis_for_usd(10000, 6000000000); // $100 USD at $60,000 BTC
/// ```
pub fn calculate_satoshis_for_usd(usd_cents: u128, btc_price_usd_cents: u128) -> u128 {
    // 1 BTC = 100,000,000 satoshis
    const SATOSHIS_PER_BTC: u128 = 100_000_000;

    // Calculate: (usd_cents * satoshis_per_btc) / btc_price_usd_cents
    // This gives us the exact satoshis needed for the USD amount
    (usd_cents * SATOSHIS_PER_BTC) / btc_price_usd_cents
}

pub fn calculate_satoshis_for_usd_with_spread(usd_cents: u128, btc_price_usd_cents: u128, spread_percentage: u128) -> u128 {
    // Calculate how much BTC (in satoshis) the user needs to pay for the desired USD amount
    let satoshis_needed = calculate_satoshis_for_usd(usd_cents, btc_price_usd_cents);

    // Add spread (making BTC slightly more expensive for the user)
    satoshis_needed + (satoshis_needed * spread_percentage / 1000)
}
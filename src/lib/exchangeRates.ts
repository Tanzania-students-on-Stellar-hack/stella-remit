// Real-time exchange rates for Stellar assets
// Uses CoinGecko API for live pricing

interface ExchangeRate {
  [key: string]: number;
}

// Fallback rates if API fails
const FALLBACK_RATES: Record<string, ExchangeRate> = {
  XLM: { USDC: 0.12, EURC: 0.11, XLM: 1 },
  USDC: { XLM: 8.33, EURC: 0.92, USDC: 1 },
  EURC: { XLM: 9.09, USDC: 1.09, EURC: 1 },
};

let cachedRates: Record<string, ExchangeRate> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Get real-time exchange rates from CoinGecko
 */
export async function getExchangeRates(): Promise<Record<string, ExchangeRate>> {
  // Return cached rates if still fresh
  if (cachedRates && Date.now() - lastFetch < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // Fetch XLM price in USD and EUR
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd,eur'
    );
    
    if (!response.ok) throw new Error('Failed to fetch rates');
    
    const data = await response.json();
    const xlmUsd = data.stellar?.usd || 0.12;
    const xlmEur = data.stellar?.eur || 0.11;

    // Calculate all conversion rates
    const rates: Record<string, ExchangeRate> = {
      XLM: {
        USDC: xlmUsd,
        EURC: xlmEur,
        XLM: 1,
      },
      USDC: {
        XLM: 1 / xlmUsd,
        EURC: xlmEur / xlmUsd,
        USDC: 1,
      },
      EURC: {
        XLM: 1 / xlmEur,
        USDC: xlmUsd / xlmEur,
        EURC: 1,
      },
    };

    cachedRates = rates;
    lastFetch = Date.now();
    
    return rates;
  } catch (error) {
    console.warn('Failed to fetch live rates, using fallback:', error);
    return FALLBACK_RATES;
  }
}

/**
 * Get exchange rate between two assets
 */
export async function getRate(fromAsset: string, toAsset: string): Promise<number> {
  const rates = await getExchangeRates();
  return rates[fromAsset]?.[toAsset] || 0;
}

/**
 * Convert amount from one asset to another
 */
export async function convertAmount(
  amount: number,
  fromAsset: string,
  toAsset: string
): Promise<number> {
  const rate = await getRate(fromAsset, toAsset);
  return amount * rate;
}

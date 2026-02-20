import * as StellarSdk from "@stellar/stellar-sdk";

// Toggle between testnet and mainnet
const USE_TESTNET = true; // Set to false for mainnet

const HORIZON_URL = USE_TESTNET 
  ? "https://horizon-testnet.stellar.org"
  : "https://horizon.stellar.org";

const SOROBAN_RPC_URL = USE_TESTNET
  ? "https://soroban-testnet.stellar.org"
  : "https://soroban-rpc.mainnet.stellar.gateway.fm";

const NETWORK_PASSPHRASE = USE_TESTNET
  ? StellarSdk.Networks.TESTNET
  : StellarSdk.Networks.PUBLIC;

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);
export const sorobanServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);
export const networkPassphrase = NETWORK_PASSPHRASE;
export const isTestnet = USE_TESTNET;

export const getAccount = async (publicKey: string) => {
  return server.loadAccount(publicKey);
};

export const getBalance = async (publicKey: string) => {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map((b: any) => ({
      asset: b.asset_type === "native" ? "XLM" : `${b.asset_code}`,
      balance: b.balance,
    }));
  } catch {
    return [];
  }
};

export const getTransactionHistory = async (publicKey: string) => {
  try {
    const txs = await server
      .transactions()
      .forAccount(publicKey)
      .order("desc")
      .limit(20)
      .call();
    return txs.records;
  } catch {
    return [];
  }
};


// Friendbot for testnet funding
export const fundTestnetAccount = async (publicKey: string) => {
  if (!USE_TESTNET) {
    throw new Error("Friendbot only works on testnet");
  }
  
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );
    const responseJSON = await response.json();
    return responseJSON;
  } catch (error) {
    console.error("Friendbot error:", error);
    throw error;
  }
};

// Explorer URLs
const EXPLORER_BASE = USE_TESTNET
  ? "https://stellar.expert/explorer/testnet"
  : "https://stellar.expert/explorer/public";

export const EXPLORER_URL = EXPLORER_BASE;
export const txExplorerUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;
export const accountExplorerUrl = (key: string) => `${EXPLORER_BASE}/account/${key}`;

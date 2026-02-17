import * as StellarSdk from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon.stellar.org";
const NETWORK_PASSPHRASE = StellarSdk.Networks.PUBLIC;

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

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

export const EXPLORER_URL = "https://stellar.expert/explorer/public";
export const txExplorerUrl = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const accountExplorerUrl = (key: string) => `${EXPLORER_URL}/account/${key}`;

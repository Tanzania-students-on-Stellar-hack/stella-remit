import * as StellarSdk from "@stellar/stellar-sdk";
import { server } from "./stellar";

const NETWORK_PASSPHRASE = StellarSdk.Networks.PUBLIC;

// Common stablecoin issuers on Stellar
export const ASSETS = {
  USDC: new StellarSdk.Asset(
    "USDC",
    "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
  ),
  EURC: new StellarSdk.Asset(
    "EURC",
    "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2"
  ),
  // Add more assets as needed
};

/**
 * Find payment paths for cross-border transfers
 * This enables automatic currency conversion using Stellar's built-in DEX
 */
export async function findPaymentPaths(
  sourceAccount: string,
  destinationAsset: StellarSdk.Asset,
  destinationAmount: string
) {
  try {
    const paths = await server
      .strictReceivePaths(sourceAccount, destinationAsset, destinationAmount)
      .call();

    return paths.records.map((path: any) => ({
      sourceAmount: path.source_amount,
      sourceAsset: path.source_asset_type === "native" 
        ? "XLM" 
        : `${path.source_asset_code}`,
      destinationAmount: path.destination_amount,
      destinationAsset: destinationAsset.code,
      path: path.path,
    }));
  } catch (error) {
    console.error("Error finding payment paths:", error);
    throw error;
  }
}

/**
 * Execute a path payment (cross-border with automatic conversion)
 * Guarantees recipient receives exact amount in their desired currency
 */
export async function sendPathPayment(
  sourceKeypair: StellarSdk.Keypair,
  destinationPublicKey: string,
  sendAsset: StellarSdk.Asset,
  sendMax: string,
  destAsset: StellarSdk.Asset,
  destAmount: string,
  memo?: string
) {
  try {
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
    const fee = await server.fetchBaseFee();

    const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: fee.toString(),
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    // Add path payment operation
    txBuilder.addOperation(
      StellarSdk.Operation.pathPaymentStrictReceive({
        sendAsset: sendAsset,
        sendMax: sendMax,
        destination: destinationPublicKey,
        destAsset: destAsset,
        destAmount: destAmount,
        path: [], // Let Stellar auto-route through DEX
      })
    );

    // Add memo if provided
    if (memo) {
      txBuilder.addMemo(StellarSdk.Memo.text(memo));
    }

    txBuilder.setTimeout(30);
    const transaction = txBuilder.build();

    // Sign and submit
    transaction.sign(sourceKeypair);
    const result = await server.submitTransaction(transaction);

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error: any) {
    console.error("Path payment error:", error);
    throw new Error(error.response?.data?.extras?.result_codes?.operations?.[0] || error.message);
  }
}

/**
 * Get exchange rate quote between two assets
 */
export async function getExchangeQuote(
  sourceAsset: StellarSdk.Asset,
  destAsset: StellarSdk.Asset,
  amount: string
) {
  try {
    // Use a dummy account for quote calculation
    const dummyAccount = StellarSdk.Keypair.random().publicKey();
    
    const paths = await server
      .strictReceivePaths(dummyAccount, destAsset, amount)
      .call();

    if (paths.records.length === 0) {
      throw new Error("No conversion path available");
    }

    const bestPath = paths.records[0];
    const rate = parseFloat(bestPath.source_amount) / parseFloat(amount);

    return {
      sourceAmount: bestPath.source_amount,
      destinationAmount: amount,
      rate: rate.toFixed(6),
      path: bestPath.path,
    };
  } catch (error) {
    console.error("Quote error:", error);
    throw error;
  }
}

/**
 * Create trustline for custom asset
 * Required before receiving non-native assets
 */
export async function createTrustline(
  accountKeypair: StellarSdk.Keypair,
  asset: StellarSdk.Asset,
  limit?: string
) {
  try {
    const account = await server.loadAccount(accountKeypair.publicKey());
    const fee = await server.fetchBaseFee();

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: fee.toString(),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: asset,
          limit: limit,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(accountKeypair);
    const result = await server.submitTransaction(transaction);

    return {
      success: true,
      hash: result.hash,
    };
  } catch (error: any) {
    console.error("Trustline error:", error);
    throw error;
  }
}

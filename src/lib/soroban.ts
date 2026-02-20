import * as StellarSdk from "@stellar/stellar-sdk";
import { sorobanServer } from "./stellar";

const NETWORK_PASSPHRASE = StellarSdk.Networks.PUBLIC;

// Deployed Soroban escrow contract on testnet
export const ESCROW_CONTRACT_ID = "CBUE656QQWRAHZFA4HCWBFYUJOVME7XDNQ4QXQUIJDND2ACBGA6BAEU7";

/**
 * Invoke a Soroban smart contract method
 */
export async function invokeSorobanContract(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  sourceKeypair: StellarSdk.Keypair
) {
  try {
    const sourceAccount = await sorobanServer.getAccount(sourceKeypair.publicKey());
    
    const contract = new StellarSdk.Contract(contractId);
    
    // Build the transaction
    const builtTransaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    // Simulate first to get resource fees
    const simulatedTx = await sorobanServer.simulateTransaction(builtTransaction);
    
    if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) {
      throw new Error(`Simulation failed: ${simulatedTx.error}`);
    }

    // Prepare the transaction with simulation results
    const preparedTx = StellarSdk.rpc.assembleTransaction(
      builtTransaction,
      simulatedTx
    ).build();

    // Sign and submit
    preparedTx.sign(sourceKeypair);
    const sendResponse = await sorobanServer.sendTransaction(preparedTx);

    if (sendResponse.status === "PENDING") {
      let getResponse = await sorobanServer.getTransaction(sendResponse.hash);
      
      // Poll for result
      while (getResponse.status === "NOT_FOUND") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResponse = await sorobanServer.getTransaction(sendResponse.hash);
      }

      if (getResponse.status === "SUCCESS") {
        return {
          success: true,
          hash: sendResponse.hash,
          result: getResponse.returnValue,
        };
      } else {
        throw new Error(`Transaction failed: ${getResponse.status}`);
      }
    }

    throw new Error("Transaction not pending");
  } catch (error) {
    console.error("Soroban invocation error:", error);
    throw error;
  }
}

/**
 * Create an escrow using Soroban smart contract
 */
export async function createSorobanEscrow(
  sourceKeypair: StellarSdk.Keypair,
  recipientAddress: string,
  amount: string,
  deadline: number
) {
  const args = [
    StellarSdk.nativeToScVal(sourceKeypair.publicKey(), { type: "address" }),
    StellarSdk.nativeToScVal(recipientAddress, { type: "address" }),
    StellarSdk.nativeToScVal(BigInt(Math.floor(parseFloat(amount) * 10_000_000)), { type: "i128" }),
    StellarSdk.nativeToScVal(deadline, { type: "u64" }),
  ];

  return invokeSorobanContract(ESCROW_CONTRACT_ID, "create_escrow", args, sourceKeypair);
}

/**
 * Release escrow funds
 */
export async function releaseSorobanEscrow(
  sourceKeypair: StellarSdk.Keypair,
  escrowId: string
) {
  const args = [
    StellarSdk.nativeToScVal(escrowId, { type: "string" }),
  ];

  return invokeSorobanContract(ESCROW_CONTRACT_ID, "release", args, sourceKeypair);
}

/**
 * Get escrow details from contract
 */
export async function getEscrowDetails(escrowId: string) {
  const args = [StellarSdk.nativeToScVal(escrowId, { type: "string" })];
  
  const contract = new StellarSdk.Contract(ESCROW_CONTRACT_ID);
  const sourceKeypair = StellarSdk.Keypair.random(); // Dummy for read-only
  
  const sourceAccount = await sorobanServer.getAccount(sourceKeypair.publicKey());
  
  const builtTransaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_escrow", ...args))
    .setTimeout(30)
    .build();

  const simulatedTx = await sorobanServer.simulateTransaction(builtTransaction);
  
  if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) {
    throw new Error(`Failed to get escrow: ${simulatedTx.error}`);
  }

  return simulatedTx.result?.retval;
}

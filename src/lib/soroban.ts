import * as StellarSdk from "@stellar/stellar-sdk";
import { sorobanServer, networkPassphrase } from "./stellar";

// Use the same network as stellar.ts (testnet for hackathon)
const NETWORK_PASSPHRASE = networkPassphrase;

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
        // Log the full response for debugging
        console.error("Transaction failed with status:", getResponse.status);
        console.error("Full response:", getResponse);
        
        // Try to extract diagnostic events for better error messages
        let errorDetails = "";
        try {
          if (getResponse.resultMetaXdr) {
            console.error("Result meta:", getResponse.resultMetaXdr);
            
            // Parse the XDR to get diagnostic events
            const meta = StellarSdk.xdr.TransactionMeta.fromXDR(getResponse.resultMetaXdr, 'base64');
            console.log("Parsed meta:", meta);
            
            // Try to extract error from diagnostic events
            if (meta.value && meta.value().sorobanMeta) {
              const events = meta.value().sorobanMeta().diagnosticEvents();
              console.log("Diagnostic events:", events);
              
              // Look for error events
              events.forEach((event: any) => {
                const eventData = event.event();
                console.log("Event:", eventData);
                if (eventData.body && eventData.body().value) {
                  const topics = eventData.body().value().topics();
                  const data = eventData.body().value().data();
                  console.log("Topics:", topics, "Data:", data);
                }
              });
            }
          }
        } catch (parseError) {
          console.error("Could not parse diagnostic events:", parseError);
        }
        
        throw new Error(`Transaction failed: ${getResponse.status}${errorDetails ? ` - ${errorDetails}` : ''}`);
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
  // Native XLM token address on Stellar
  const nativeTokenAddress = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
  
  const args = [
    StellarSdk.nativeToScVal(sourceKeypair.publicKey(), { type: "address" }),
    StellarSdk.nativeToScVal(recipientAddress, { type: "address" }),
    StellarSdk.nativeToScVal(nativeTokenAddress, { type: "address" }), // Add token address
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
  // Native XLM token address on Stellar
  const nativeTokenAddress = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
  
  const escrowIdNum = parseInt(escrowId);
  
  console.log("Releasing escrow:", {
    escrowId: escrowIdNum,
    tokenAddress: nativeTokenAddress,
    caller: sourceKeypair.publicKey()
  });
  
  const args = [
    StellarSdk.nativeToScVal(escrowIdNum, { type: "u64" }), // escrow_id should be u64, not string
    StellarSdk.nativeToScVal(nativeTokenAddress, { type: "address" }), // Add token address
  ];

  return invokeSorobanContract(ESCROW_CONTRACT_ID, "release", args, sourceKeypair);
}

/**
 * Get escrow details from contract
 */
export async function getEscrowDetails(escrowId: string) {
  const args = [StellarSdk.nativeToScVal(parseInt(escrowId), { type: "u64" })];
  
  const contract = new StellarSdk.Contract(ESCROW_CONTRACT_ID);
  
  try {
    // Build a transaction without needing a real account
    const operation = contract.call("get_escrow", ...args);
    
    const simulatedTx = await sorobanServer.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(ESCROW_CONTRACT_ID, "0"), // Use contract as source
        {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        }
      )
        .addOperation(operation)
        .setTimeout(30)
        .build()
    );
    
    if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) {
      throw new Error(`Failed to get escrow: ${simulatedTx.error}`);
    }

    return simulatedTx.result?.retval;
  } catch (error: any) {
    throw new Error(`Failed to get escrow: ${error.message}`);
  }
}

/**
 * Get the current counter value (for debugging)
 */
export async function getContractCounter() {
  const contract = new StellarSdk.Contract(ESCROW_CONTRACT_ID);
  
  try {
    // Build a transaction without needing a real account
    const operation = contract.call("get_counter");
    
    // Simulate directly without building full transaction
    const simulatedTx = await sorobanServer.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(ESCROW_CONTRACT_ID, "0"), // Use contract as source
        {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        }
      )
        .addOperation(operation)
        .setTimeout(30)
        .build()
    );
    
    if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) {
      console.error("Failed to get counter:", simulatedTx.error);
      return null;
    }

    const counter = simulatedTx.result?.retval;
    return counter ? StellarSdk.scValToNative(counter) : 0;
  } catch (error) {
    console.error("Error getting counter:", error);
    return null;
  }
}

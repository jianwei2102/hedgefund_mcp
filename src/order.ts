import { getDriftClient } from "./drift.js";
import {
  BN,
  PositionDirection,
  OrderType,
  BASE_PRECISION,
  MainnetPerpMarkets,
  loadKeypair,
} from "@drift-labs/sdk";
import { VersionedTransaction, Connection } from "@solana/web3.js";

// Helper function to swap all USDC and SOL to JLP
export async function swapTokenToJLP() {
  // Swap Jito SOL to JLP
  try {
    const keypair = loadKeypair(process.env.WALLET_PRIVATE_KEY!);
    const driftClient = await getDriftClient();
    const quoteResponse = await (
      await fetch(
        "https://lite-api.jup.ag/swap/v1/quote?inputMint=J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn&outputMint=27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4&amount=10000000&slippageBps=50&restrictIntermediateTokens=true"
      )
    ).json();
    console.log(JSON.stringify(quoteResponse, null, 2));

    const swapResponse = await (
      await fetch("https://lite-api.jup.ag/swap/v1/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: driftClient.provider.wallet.publicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          dynamicSlippage: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000,
              priorityLevel: "veryHigh",
            },
          },
        }),
      })
    ).json();

    console.log(swapResponse);

    const transactionBase64 = swapResponse.swapTransaction;
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(transactionBase64, "base64")
    );
    console.log(transaction);
    transaction.sign([keypair]);

    const transactionBinary = transaction.serialize();
    console.log(transactionBinary);

    const { txSig } = await driftClient.sendTransaction(transaction);
    const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
    if (!SOLANA_RPC_URL) {
      throw new Error("SOLANA_RPC_URL is not set");
    }
    const connection = new Connection(SOLANA_RPC_URL, "confirmed");

    try {
      const confirmation = await connection.confirmTransaction(
        txSig,
        "finalized"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(
            confirmation.value.err
          )}\nhttps://solscan.io/tx/${txSig}/`
        );
      }
      console.log(`Transaction successful: https://solscan.io/tx/${txSig}/`);
      return txSig;
    } catch (confirmError) {
      console.error("Error confirming transaction:", confirmError);
      throw confirmError;
    }
  } catch (swapError) {
    console.error("Error during USDC to JLP swap:", swapError);
  }
}

export async function placePerpMarketOrder(
  marketIndex: any,
  direction: any,
  size: any
) {
  const market = MainnetPerpMarkets.find((token) => {
    return token.marketIndex === marketIndex;
  });
  if (!market) {
    throw new Error(`Market index ${marketIndex} not found`);
  }
  const driftClient = await getDriftClient();
  const orderParams = {
    orderType: OrderType.MARKET,
    marketIndex,
    direction:
      direction === "long" ? PositionDirection.LONG : PositionDirection.SHORT,
    baseAssetAmount: new BN(size * BASE_PRECISION),
  };
  console.log(new BN(size * BASE_PRECISION));

  try {
    const tx = await driftClient.placePerpOrder(orderParams);
    console.log(`Market order placed. Transaction: ${tx}`);
    return {
      orderType: orderParams.orderType,
      marketIndex: orderParams.marketIndex,
      direction: orderParams.direction,
      baseAssetAmount: orderParams.baseAssetAmount.toString(),
      txId: tx,
    };
  } catch (error: any) {
    console.error(`Error placing market order: ${error.message}`);
    return {
      error: error.message,
    };
  }
}

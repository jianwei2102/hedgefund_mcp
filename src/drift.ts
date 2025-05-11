import dotenv from "dotenv";
import { Connection } from "@solana/web3.js";
import { DriftClient, BN } from "@drift-labs/sdk";
import { Wallet, loadKeypair, convertToNumber } from "@drift-labs/sdk";
import { Position } from "./types.js";
dotenv.config();

let driftClientInstance: DriftClient | null = null;

export async function getDriftClient(): Promise<DriftClient> {
  if (driftClientInstance) {
    return driftClientInstance;
  }
  return await subscribeDriftClient();
}

export async function subscribeDriftClient(): Promise<DriftClient> {
  const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
  if (!WALLET_PRIVATE_KEY) {
    throw new Error("WALLET_PRIVATE_KEY environment variable is not set");
  }
  const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
  if (!SOLANA_RPC_URL) {
    throw new Error("SOLANA_RPC_URL environment variable is not set");
  }

  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  const wallet = new Wallet(loadKeypair(WALLET_PRIVATE_KEY));
  const driftClient = new DriftClient({
    connection,
    wallet,
    env: "mainnet-beta",
  });
  await driftClient.subscribe();
  return driftClient;
}

export async function depositJLPToken(): Promise<any> {
  try {
    const driftClient = await getDriftClient();
    const marketIndex = 19; // JLP
    const amount = driftClient.convertToSpotPrecision(marketIndex, 0.1); // 0.1 JLP
    const associatedTokenAccount = await driftClient.getAssociatedTokenAccount(
      marketIndex
    );

    const txSig = await driftClient.deposit(
      amount,
      marketIndex,
      associatedTokenAccount
    );
    console.log(`Deposit transaction sent: ${txSig}`);

    const confirmation = await driftClient.connection.confirmTransaction(
      txSig,
      "confirmed"
    );
    if (confirmation.value.err) {
      throw new Error(
        `Deposit failed: ${JSON.stringify(
          confirmation.value.err
        )}\nhttps://solscan.io/tx/${txSig}/`
      );
    }
    console.log(`Deposit successful: https://solscan.io/tx/${txSig}/`);
    return txSig;
  } catch (error) {
    console.error("Error during JLP deposit:", error);
    throw error;
  }
}

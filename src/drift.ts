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
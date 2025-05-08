
import { Connection } from "@solana/web3.js"
import { DriftClient } from "@drift-labs/sdk"
import { Wallet, loadKeypair } from "@drift-labs/sdk"
import { JLPPosition } from "./types.js"
import dotenv from "dotenv";
dotenv.config();

let driftClientInstance: DriftClient | null = null;

export async function getDriftClient(): Promise<DriftClient> {
  if (driftClientInstance) {
    return driftClientInstance;
  }
  return await subscribeDriftClient();
}

export async function subscribeDriftClient(): Promise<DriftClient> {
  const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY
  if (!WALLET_PRIVATE_KEY) { throw new Error("WALLET_PRIVATE_KEY environment variable is not set") }
  const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL
  if (!SOLANA_RPC_URL) { throw new Error("SOLANA_RPC_URL environment variable is not set") }

  const connection = new Connection(SOLANA_RPC_URL , "confirmed")
  const wallet =  new Wallet(loadKeypair(WALLET_PRIVATE_KEY))
  const driftClient = new DriftClient({
    connection,
    wallet,
    env: 'mainnet-beta',
  })
  await driftClient.subscribe()
  return driftClient
}

export async function getJLPPosition(): Promise<JLPPosition> {
  const driftClient = await getDriftClient()
  const jlpSpotMarketIndex = 5
  const pos = driftClient.getUser().getSpotPosition(jlpSpotMarketIndex)
  if (!pos) {
    return {
      amount: 0,
      usdValue: 0,
    }
  }

  const amount = pos.scaledBalance.toNumber() / 1e9 // Drift uses 1e9 base units??? To confirm
  const jlpPrice = driftClient.getSpotMarketAccount(jlpSpotMarketIndex)?.lastTwapTs.toNumber()

  return{
    amount,
    usdValue: amount * jlpPrice
  }
}

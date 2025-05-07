// src/drift.ts

import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { DriftClient, BN, PositionDirection } from "@drift-labs/sdk"
import { Wallet, loadKeypair } from "@drift-labs/sdk";
import { HedgePosition, Token } from "./types"
import fs from "fs";
import path from "path";

// Drift market indexes for each asset
const DRIFT_MARKET_INDEX: Record<Token, number> = {
  SOL: 0,
  ETH: 1,
  WBTC: 2,
  USDC: -1,
  USDT: -1
}

// For simplicity, use a local keypair (for production use a secure wallet)
const RPC_CONNECTION = "https://api.mainnet-beta.solana.com"
const DRIFT_PROGRAM_ID = new PublicKey("8tfDNiaEyrV6Q1U4DEXrEigs9DoDtkugzFbybENEbCDz") // mainnet
const keyPairFile = path.join(__dirname, "../drift-keypair.json")

export async function getDriftClient(): Promise<DriftClient> {
  const connection = new Connection(RPC_CONNECTION, "confirmed")
  const wallet =  new Wallet(loadKeypair(keyPairFile))
  const driftClient = new DriftClient({
    connection,
    wallet,
    env: 'devnet',
  })
  await driftClient.subscribe()
  return driftClient
}

export async function getDriftHedgePositions(): Promise<HedgePosition[]> {
  const drift = await getDriftClient();
  const user = drift.getUser();
  const positions = user?.getPerpPosition(1) ?? []; // Ensure positions is always an array
  const result: HedgePosition[] = [];

  for (const pos of positions) {
    if (!pos.baseAssetAmount.isZero()) {
      // Find the token corresponding to the market index
      const token = (Object.entries(DRIFT_MARKET_INDEX).find(([, idx]) => idx === pos.marketIndex)?.[0] ?? null) as Token;
      if (!token || token === "USDC" || token === "USDT") continue;

      const amount = pos.baseAssetAmount.toNumber() / 1e9; // Drift uses 1e9 base units
      const price = drift.getPerpMarketAccount(pos.marketIndex).amm.lastMarkPrice.toNumber() / 1e6;
      result.push({
        token,
        amount,
        usdValue: amount * price,
      });
    }
  }

  return result;
}

// Place a hedge (open/close perp position)
export async function placeDriftHedge(token: Token, amount: number): Promise<string> {
  if (token === "USDC" || token === "USDT") throw new Error("No hedge for stables")
  const drift = await getDriftClient()
  const marketIndex = DRIFT_MARKET_INDEX[token]
  const direction = amount >= 0 ? PositionDirection.LONG : PositionDirection.SHORT
  const absAmount = Math.abs(amount)

  // Drift expects base asset amount in 1e9 units
  const baseAssetAmount = new BN(Math.round(absAmount * 1e9))
  const tx = await drift.openPosition(marketIndex, direction, baseAssetAmount)
  return tx
}

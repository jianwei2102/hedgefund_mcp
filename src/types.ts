// src/types.ts

export type Token = "SOL" | "ETH" | "WBTC" | "USDC" | "USDT"

export interface JLPPosition {
  token: Token
  amount: number // token amount
  usdValue: number
}

export interface HedgePosition {
  token: Token
  amount: number // positive: long, negative: short
  usdValue: number
}

export interface DeltaReport {
  totalDeltaUsd: number
  perTokenDelta: Record<Token, number>
  suggestedHedges: HedgePosition[]
}

// src/hedge.ts

import { JLPPosition, HedgePosition, DeltaReport, Token } from "./types"

// Only hedge these
const HEDGE_TOKENS: Token[] = ["SOL", "ETH", "WBTC"]

// Dummy prices (replace with oracle if needed)
const PRICES: Record<Token, number> = {
  SOL: 180,
  ETH: 3000,
  WBTC: 70000,
  USDC: 1,
  USDT: 1
}

export function calculateDelta(
  jlpPositions: JLPPosition[],
  hedgePositions: HedgePosition[]
): DeltaReport {
  const perTokenDelta: Record<Token, number> = {
    SOL: 0, ETH: 0, WBTC: 0, USDC: 0, USDT: 0
  }

  for (const pos of jlpPositions) {
    if (!HEDGE_TOKENS.includes(pos.token)) continue
    perTokenDelta[pos.token] += pos.usdValue
  }
  for (const hedge of hedgePositions) {
    if (!HEDGE_TOKENS.includes(hedge.token)) continue
    perTokenDelta[hedge.token] -= hedge.usdValue
  }

  // Only sum non-stable tokens
  const totalDeltaUsd = HEDGE_TOKENS.reduce((sum, t) => sum + perTokenDelta[t], 0)

  const suggestedHedges: HedgePosition[] = HEDGE_TOKENS
    .filter(token => Math.abs(perTokenDelta[token]) > 1)
    .map(token => ({
      token,
      amount: -perTokenDelta[token] / PRICES[token],
      usdValue: -perTokenDelta[token]
    }))

  return { totalDeltaUsd, perTokenDelta, suggestedHedges }
}

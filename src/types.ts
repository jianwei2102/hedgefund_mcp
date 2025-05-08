export type Token = "SOL" | "ETH" | "BTC"

export interface Position {
  amount: number
  usdValue: number
}

export type HedgePositions = {
  [K in Token]: Position
}
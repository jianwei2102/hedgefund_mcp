export type Token = "SOL" | "ETH" | "BTC";

export interface Position {
  amount: number;
  usdValue: number;
}

export type HedgePositions = {
  [K in Token]: Position;
};

export interface SpotBalance {
  symbol: string;
  balance: number;
  price: number;
  usdValue: number;
}

export interface PerpBalance {
  symbol: string;
  baseAssetAmount: number;
  price: number;
  usdValue: number;
}

export interface AccountPortfolio {
  spotBalances: SpotBalance[];
  perpBalances: PerpBalance[];
}

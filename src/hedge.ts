import { HedgePositions, Position } from "./types.js";
import { getTokenPrices } from "./jupiter.js";
import { getDriftClient } from "./drift.js";
import { DriftPerpsMarketIndexes, TARGET_WEIGHTAGE } from "./constants.js";
import {
  BN,
  convertToNumber,
  MainnetSpotMarkets,
  MainnetPerpMarkets,
} from "@drift-labs/sdk";

export async function calculateIdealDeltaNeutralHedge(
  jlpPosition: Position
): Promise<HedgePositions> {
  const { usdValue } = jlpPosition;

  const tokenPrices = await getTokenPrices();
  console.log({ tokenPrices });

  const solUsdValue = TARGET_WEIGHTAGE.SOL * usdValue;
  const solAmount = solUsdValue / tokenPrices.SOL;
  const ethUsdValue = TARGET_WEIGHTAGE.ETH * usdValue;
  const ethAmount = ethUsdValue / tokenPrices.ETH;
  const btcUsdValue = TARGET_WEIGHTAGE.BTC * usdValue;
  const btcAmount = btcUsdValue / tokenPrices.BTC;

  return {
    SOL: {
      amount: solAmount,
      usdValue: solUsdValue,
    },
    ETH: {
      amount: ethAmount,
      usdValue: ethUsdValue,
    },
    BTC: {
      amount: btcAmount,
      usdValue: btcUsdValue,
    },
  };
}

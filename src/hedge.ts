import { HedgePositions, Position } from "./types.js";
import { getTokenPrices } from "./jupiter.js";
import { getDriftClient } from "./drift.js";
import { DriftPerpsMarketIndexes, TARGET_WEIGHTAGE } from "./constants.js";
import { BN, convertToNumber } from "@drift-labs/sdk";

export async function getJLPPosition(): Promise<Position> {
  const driftClient = await getDriftClient()
  const jlpSpotMarketIndex = 19
  const jlpPrecision = new BN(1e6)
  const pos = driftClient.getUser().getSpotPosition(jlpSpotMarketIndex)
  if (!pos) {
    return {
      amount: 0,
      usdValue: 0,
    }
  }

  const amount = pos.scaledBalance.toNumber() / 1e9 // Drift uses 1e9 base units
  const spotPrice = driftClient.getSpotMarketAccount(jlpSpotMarketIndex)?.historicalIndexData.lastIndexBidPrice
  const spotPriceConverted = convertToNumber(spotPrice, jlpPrecision)

  return{
    amount,
    usdValue: amount * spotPriceConverted
  }
}

export async function getHedgePerpsPositions(): Promise<HedgePositions> {
  const driftClient = await getDriftClient()
  const hedgePositions: HedgePositions = {
    SOL: {
      amount: 0,
      usdValue: 0,
    },
    ETH: {
      amount: 0,
      usdValue: 0,
    },
    BTC: {
      amount: 0,
      usdValue: 0,
    },
  }

  const solanaPos = driftClient.getUser().getSpotPosition(DriftPerpsMarketIndexes.SOL)
  if (solanaPos) {
    hedgePositions.SOL.amount = solanaPos.scaledBalance.toNumber() / 1e9
    hedgePositions.SOL.usdValue = solanaPos.scaledBalance.toNumber() / 1e9 * convertToNumber(driftClient.getSpotMarketAccount(DriftPerpsMarketIndexes.SOL)?.historicalIndexData.lastIndexBidPrice, new BN(1e6))
  }

  const ethPos = driftClient.getUser().getSpotPosition(DriftPerpsMarketIndexes.ETH)
  if (ethPos) {
    hedgePositions.ETH.amount = ethPos.scaledBalance.toNumber() / 1e9
    hedgePositions.ETH.usdValue = ethPos.scaledBalance.toNumber() / 1e9 * convertToNumber(driftClient.getSpotMarketAccount(DriftPerpsMarketIndexes.ETH)?.historicalIndexData.lastIndexBidPrice, new BN(1e6))
  }

  const btcPos = driftClient.getUser().getSpotPosition(DriftPerpsMarketIndexes.BTC)
  if (btcPos) {
    hedgePositions.BTC.amount = btcPos.scaledBalance.toNumber() / 1e9
    hedgePositions.BTC.usdValue = btcPos.scaledBalance.toNumber() / 1e9 * convertToNumber(driftClient.getSpotMarketAccount(DriftPerpsMarketIndexes.BTC)?.historicalIndexData.lastIndexBidPrice, new BN(1e6))
  }
  
  return hedgePositions
}

export async function calculateIdealDeltaNeutralHedge(jlpPosition: Position): Promise<HedgePositions> {
  const { usdValue } = jlpPosition

  const tokenPrices = await getTokenPrices()
  console.log({ tokenPrices })

  const solUsdValue = (TARGET_WEIGHTAGE.SOL * usdValue)
  const solAmount = solUsdValue / tokenPrices.SOL
  const ethUsdValue = (TARGET_WEIGHTAGE.ETH * usdValue)
  const ethAmount = ethUsdValue / tokenPrices.ETH
  const btcUsdValue = (TARGET_WEIGHTAGE.BTC * usdValue)
  const btcAmount = btcUsdValue / tokenPrices.BTC

  return {
    SOL: { 
      amount: solAmount,
      usdValue: solUsdValue
    },
    ETH: {
      amount: ethAmount,
      usdValue: ethUsdValue
    },
    BTC: {
      amount: btcAmount,
      usdValue: btcUsdValue
    }
  }
}
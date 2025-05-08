import { Connection } from "@solana/web3.js"
import { DriftClient, BN } from "@drift-labs/sdk"
import { Wallet, loadKeypair, convertToNumber } from "@drift-labs/sdk"
import { HedgePositions, Position } from "./types.js"
import dotenv from "dotenv";
import { DRIFT_PERPS_MARKET_INDEXES, DriftPerpsMarketIndexes } from "./constants.js";
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
  // const usdcPrice = driftClient.getSpotMarketAccount(0)?.historicalIndexData.lastIndexBidPrice
  // const solanaPrice = driftClient.getSpotMarketAccount(1)?.historicalIndexData.lastIndexBidPrice
  // const usdcPriceConverted = convertToNumber(usdcPrice, new BN(1e6))
  // const solanaPriceConverted = convertToNumber(solanaPrice, new BN(1e6))
  // console.log({ usdcPriceConverted, solanaPriceConverted })
  const spotPriceConverted = convertToNumber(spotPrice, jlpPrecision)
  console.log({spotPriceConverted}) // JLP price is wrong

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

export async function calculateIdealDeltaNeutralHedge() {
  throw new Error("Not implemented")
}
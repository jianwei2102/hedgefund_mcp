
import { Connection } from "@solana/web3.js"
import { DriftClient } from "@drift-labs/sdk"
import { Wallet, loadKeypair } from "@drift-labs/sdk"
import { JLPPosition } from "./types.js"
import path from "path"
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const RPC_CONNECTION = "https://api.devnet.solana.com";

// Get the directory name in ES module scope
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const keyPairFile = path.join(__dirname, "../drift-keypair.json");

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

  const connection = new Connection(RPC_CONNECTION, "confirmed")
  const wallet =  new Wallet(loadKeypair(WALLET_PRIVATE_KEY))
  const driftClient = new DriftClient({
    connection,
    wallet,
    env: 'devnet',
  })
  await driftClient.subscribe()
  return driftClient
}

export async function getJLPPosition(): Promise<JLPPosition> {
  console.log("Getting JLP position")
  const driftClient = await getDriftClient()
  console.log({driftClient})
  console.log(driftClient.getUser())
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

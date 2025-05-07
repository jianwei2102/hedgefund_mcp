import { DriftClient, loadKeypair, Wallet } from "@drift-labs/sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import path from "path";


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

async function getPerpMarketIndexes() {
  const drift = await getDriftClient();
  await drift.subscribe();

  // Get all perp markets
  const perpMarkets = drift.getPerpMarketAccounts();
  console.log(perpMarkets)
  // const indexToSymbol: Record<number, string> = {};
  // for (const market of perpMarkets) {
  //   // marketIndex is a BN, convert to number
  //   const idx = market.marketIndex;
  //   // marketName is like "SOL-PERP"
  //   indexToSymbol[idx.toString()] = market.name;
  // }
  // await drift.unsubscribe();
  // return indexToSymbol;
}

getPerpMarketIndexes().then(console.log);

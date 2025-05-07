import { Connection, PublicKey } from "@solana/web3.js";
import { DriftClient, BN, PerpPosition } from "@drift-labs/sdk";
import { JLPPosition, Token } from "./types";

// Map Drift market index to token
const DRIFT_MARKET_INDEX_TO_TOKEN: Record<number, Token> = {
  0: "SOL",
  1: "ETH",
  2: "WBTC"
};
// Token decimals for conversion
const TOKEN_DECIMALS: Record<Token, number> = {
  SOL: 9,
  ETH: 9,
  WBTC: 9,
  USDC: 6,
  USDT: 6
};

// Helper: get mark price for a given market index
async function getMarkPrice(drift: DriftClient, marketIndex: number): Promise<number> {
  const market = drift.getPerpMarketAccount(marketIndex);
  return market.amm.lastMarkPrice.toNumber() / 1e6;
}

/**
 * Fetch the user's perp exposures on Drift as JLPPosition[]
 * @param walletAddress - user's wallet address (public key string)
 */
export async function getJLPPositions(walletAddress: string): Promise<JLPPosition[]> {
  const DRIFT_RPC = process.env.DRIFT_RPC || "https://api.mainnet-beta.solana.com";
  const DRIFT_PROGRAM_ID = new PublicKey("8tfDNiaEyrV6Q1U4DEXrEigs9DoDtkugzFbybENEbCDz"); // mainnet

  const connection = new Connection(DRIFT_RPC, "confirmed");
  const userPk = new PublicKey(walletAddress);

  // Only need read-only DriftClient
  const drift = new DriftClient({
    connection,
    wallet: {
      publicKey: userPk,
      signTransaction: async tx => tx,
      signAllTransactions: async txs => txs
    },
    programId: DRIFT_PROGRAM_ID
  });
  await drift.subscribe();

  // Fetch user account
  const userAccount = await drift.getUserAccount(userPk);
  if (!userAccount) throw new Error("User account not found on Drift");

  // Get all perp positions
  const positions: JLPPosition[] = [];
  for (const perpPos of userAccount.perpPositions) {
    const marketIndex = perpPos.marketIndex.toNumber();
    if (!(marketIndex in DRIFT_MARKET_INDEX_TO_TOKEN)) continue;
    // Only consider non-zero positions
    if (perpPos.baseAssetAmount.isZero()) continue;

    const token = DRIFT_MARKET_INDEX_TO_TOKEN[marketIndex];
    const decimals = TOKEN_DECIMALS[token];
    const amount = perpPos.baseAssetAmount.toNumber() / 10 ** decimals;
    const price = await getMarkPrice(drift, marketIndex);
    positions.push({
      token,
      amount,
      usdValue: amount * price
    });
  }

  await drift.unsubscribe();
  return positions;
}

import { getDriftClient } from "./drift.js";
import {
  BN,
  convertToNumber,
  MainnetPerpMarkets,
  MainnetSpotMarkets,
} from "@drift-labs/sdk";

export async function getJLPPosition(): Promise<any> {
  const jlpSpotMarket = MainnetSpotMarkets.find(
    (token) => token.symbol === "JLP"
  );
  const driftClient = await getDriftClient();
  const jlpSpotMarketIndex = jlpSpotMarket?.marketIndex!;
  const jlpPrecision = jlpSpotMarket?.precision;
  const pos = driftClient.getUser().getSpotPosition(jlpSpotMarketIndex);
  if (!pos) {
    return {
      amount: 0,
      usdValue: 0,
    };
  }

  const amount = pos.scaledBalance.toNumber() / 1e9;
  const spotPrice =
    driftClient.getSpotMarketAccount(jlpSpotMarketIndex)?.historicalOracleData
      .lastOraclePrice;
  const spotPriceConverted = convertToNumber(spotPrice, jlpPrecision);

  return {
    amount,
    usdValue: amount * spotPriceConverted,
  };
}

export async function getAccountPortfolio(): Promise<any> {
  const driftClient = await getDriftClient();

  const user = driftClient.getUser();
  const spotBalances = user.getUserAccount().spotPositions.map((pos) => ({
    marketIndex: pos.marketIndex,
    balance: pos.scaledBalance / 1e9,
  }));

  const perpBalances = user.getUserAccount().perpPositions.map((pos) => ({
    marketIndex: pos.marketIndex,
    baseAssetAmount: pos.baseAssetAmount / 1e9,
  }));

  return transformPortfolioData({ spotBalances, perpBalances });
}

export async function transformPortfolioData(portfolio: any) {
  const driftClient = await getDriftClient();

  const spotMarkets = MainnetSpotMarkets.reduce((acc, market) => {
    acc[market.marketIndex] = market;
    return acc;
  }, {} as Record<number, any>);

  const perpMarkets = MainnetPerpMarkets.reduce((acc, market) => {
    acc[market.marketIndex] = market;
    return acc;
  }, {} as Record<number, any>);

  const transformedSpotBalances = await Promise.all(
    portfolio.spotBalances
      .filter((pos: any) => pos.balance !== 0)
      .map(async (pos: any) => {
        const market = spotMarkets[pos.marketIndex];
        const spotMarketAccount = driftClient.getSpotMarketAccount(
          pos.marketIndex
        );
        const price = convertToNumber(
          spotMarketAccount?.historicalOracleData.lastOraclePrice,
          new BN(1e6)
        );

        return {
          symbol: market?.symbol || `Unknown-${pos.marketIndex}`,
          balance: pos.balance,
          price,
          usdValue: pos.balance * price,
        };
      })
  );

  const transformedPerpBalances = await Promise.all(
    portfolio.perpBalances
      .filter((pos: any) => pos.baseAssetAmount !== 0)
      .map(async (pos: any) => {
        const market = perpMarkets[pos.marketIndex];
        const perpMarketAccount = driftClient.getPerpMarketAccount(
          pos.marketIndex
        );
        const price = convertToNumber(
          perpMarketAccount?.amm.historicalOracleData.lastOraclePrice,
          new BN(1e6)
        );

        return {
          symbol: market?.symbol || `Unknown-${pos.marketIndex}`,
          baseAssetAmount: pos.baseAssetAmount,
          price,
          usdValue: pos.baseAssetAmount * price,
        };
      })
  );

  return {
    spotBalances: transformedSpotBalances,
    perpBalances: transformedPerpBalances,
  };
}

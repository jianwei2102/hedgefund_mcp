import { getDriftClient } from "./drift.js";
import {
  BN,
  PositionDirection,
  OrderType,
  BASE_PRECISION,
  MainnetPerpMarkets,
} from "@drift-labs/sdk";
import { MainnetSpotMarkets } from "@drift-labs/sdk";

export const min_size = {
  SOL: 0.01,
  ETH: 0.001,
  BTC: 0.0001,
};

// Swap all usdc & sol to jlp
export async function placeSpotMarketOrder(
  marketIndex: number,
  direction: "buy" | "sell",
  size: number
) {
  const driftClient = await getDriftClient();

  // Get the market info
  const market = MainnetSpotMarkets.find((m) => m.marketIndex === marketIndex);
  if (!market) {
    throw new Error(`Market index ${marketIndex} not found`);
  }

  // Convert size to proper precision
  const sizeBN = new BN(size * 1e9); // Convert to base units (1e9 precision)

  try {
    // Create the order
    const order = await driftClient.placeSpotOrder({
      marketIndex,
      direction: direction === "buy" ? "buy" : "sell",
      baseAssetAmount: sizeBN,
      price: new BN(0), // Market order
      orderType: "market",
      reduceOnly: false,
    });

    console.log(`Placed ${direction} order for ${size} ${market.symbol}`);
    return order;
  } catch (error) {
    console.error(
      `Error placing ${direction} order for ${market.symbol}:`,
      error
    );
    throw error;
  }
}

// Helper function to swap all USDC and SOL to JLP
export async function swapAllToJLP() {
  const driftClient = await getDriftClient();
  const user = driftClient.getUser();

  // Get USDC and SOL positions
  const usdcMarket = MainnetSpotMarkets.find((m) => m.symbol === "USDC");
  const solMarket = MainnetSpotMarkets.find((m) => m.symbol === "SOL");
  const jlpMarket = MainnetSpotMarkets.find((m) => m.symbol === "JLP");

  if (!usdcMarket || !solMarket || !jlpMarket) {
    throw new Error("Required markets not found");
  }

  try {
    // Get USDC balance and swap to JLP
    const usdcPosition = user.getSpotPosition(usdcMarket.marketIndex);
    if (usdcPosition && usdcPosition.scaledBalance.gt(new BN(0))) {
      const usdcAmount = usdcPosition.scaledBalance.toNumber() / 1e9;
      console.log(`Swapping ${usdcAmount} USDC to JLP`);

      // Place USDC to JLP order
      await driftClient.placeSpotOrder({
        orderType: OrderType.LIMIT,
        marketIndex: jlpMarket.marketIndex,
        direction: PositionDirection.LONG,
        baseAssetAmount: driftClient.convertToSpotPrecision(
          usdcAmount,
          usdcMarket.precision
        ),
        price: driftClient.convertToPricePrecision(usdcMarket.precision),
      });
    }

    console.log("Successfully placed all swap orders to JLP");
  } catch (error) {
    console.error("Error swapping to JLP:", error);
    throw error;
  }
}

export async function placePerpMarketOrder(
  marketIndex: any,
  direction: any,
  size: any
) {
  const market = MainnetPerpMarkets.find((token) => {
    return token.marketIndex === marketIndex;
  });
  if (!market) {
    throw new Error(`Market index ${marketIndex} not found`);
  }
  const driftClient = await getDriftClient();
  const orderParams = {
    orderType: OrderType.MARKET,
    marketIndex,
    direction:
      direction === "long" ? PositionDirection.LONG : PositionDirection.SHORT,
    baseAssetAmount: new BN(size * BASE_PRECISION),
  };
  console.log(new BN(size * BASE_PRECISION));

  try {
    const tx = await driftClient.placePerpOrder(orderParams);
    console.log(`Market order placed. Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`Error placing market order: ${error.message}`);
    return {
      error: error.message,
    };
  }

  return {
    orderType: orderParams.orderType,
    marketIndex: orderParams.marketIndex,
    direction: orderParams.direction,
    baseAssetAmount: orderParams.baseAssetAmount.toString(),
  };
}

import { TraderInterface } from '@d8x/perpetuals-sdk';
import { createWalletClient, type Address, type WalletClient, http } from 'viem';

import { orderDigest } from 'network/network';
import { OrderSideE, OrderTypeE } from 'types/enums';
import { generateHedger } from 'blockchain-api/generateHedger';
import { postOrder } from './postOrder';
import { HashZero } from 'appConstants';
import { OrderI } from 'types/types';

const DEADLINE = 60 * 60; // 1 hour from posting time

export interface HedgeConfigI {
  chainId: 42161 | 421614;
  symbol: 'ETH-USD-WEETH';
  walletClient: WalletClient;
  traderAPI: TraderInterface;
  amountCC: number;
  feeRate: number;
  indexPrice: number;
  limitPrice: number;
}

export async function closeHedge({
  chainId,
  walletClient,
  symbol,
  traderAPI,
  limitPrice,
}: HedgeConfigI): Promise<{ hash: Address }> {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const hedgeClient = await generateHedger(walletClient).then((account) =>
    createWalletClient({
      account,
      chain: walletClient.chain,
      transport: http(),
    })
  );
  const position = await traderAPI
    .positionRisk(hedgeClient.account.address, symbol)
    .then((pos) => pos[0])
    .catch(() => undefined);
  const marginTokenAddr = traderAPI.getMarginTokenFromSymbol(symbol);
  const marginTokenDec = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  if (!position || !marginTokenAddr || !marginTokenDec) {
    throw new Error(`No hedging strategy available for symbol ${symbol} on chain ID ${chainId}`);
  }
  if (position.positionNotionalBaseCCY === 0 || position.side !== OrderSideE.Sell) {
    throw new Error(
      `Invalid hedging position for trader ${walletClient.account?.address} and symbol ${symbol} on chain ID ${chainId}`
    );
  }
  const order: OrderI = {
    symbol: symbol,
    side: OrderSideE.Buy,
    type: OrderTypeE.Market,
    quantity: position.positionNotionalBaseCCY,
    limitPrice: limitPrice,
    reduceOnly: true,
    executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
    deadline: Math.floor(Date.now() / 1000 + DEADLINE),
  };
  const { data } = await orderDigest(chainId, [order], hedgeClient.account.address);
  return postOrder(hedgeClient, [HashZero], data);
}

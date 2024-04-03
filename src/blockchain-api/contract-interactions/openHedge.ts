import { TraderInterface, getMaxSignedPositionSize } from '@d8x/perpetuals-sdk';
import { createWalletClient, type Address, type WalletClient, http } from 'viem';

import { orderDigest } from 'network/network';
import { OrderSideE, OrderTypeE } from 'types/enums';
import { generateHedger } from 'blockchain-api/generateHedger';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
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

export async function openHedge({
  chainId,
  walletClient,
  symbol,
  traderAPI,
  amountCC,
  feeRate,
  indexPrice,
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
  if (position.positionNotionalBaseCCY !== 0) {
    throw new Error(
      `A hedging position already exists for trader ${walletClient.account?.address} symbol ${symbol} on chain ID ${chainId}`
    );
  }
  const orderSize = getMaxSignedPositionSize(
    amountCC, // margin collateral
    0, // current position
    0, // current locked-in value
    -1, // trade direction
    limitPrice, // limit price
    1, // margin rate
    feeRate, // fee rate
    position.markPrice, // mark price
    indexPrice, // index price
    position.collToQuoteConversion // collateral price
  );

  const order: OrderI = {
    symbol: symbol,
    side: OrderSideE.Sell,
    type: OrderTypeE.Market,
    quantity: Math.abs(orderSize),
    limitPrice: limitPrice,
    leverage: 1,
    executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
    deadline: Math.floor(Date.now() / 1000 + DEADLINE),
  };
  const { data } = await orderDigest(chainId, [order], hedgeClient.account.address);

  if (data.digests.length > 0) {
    await approveMarginToken(hedgeClient, marginTokenAddr, traderAPI.getProxyAddress(), amountCC, marginTokenDec);
  }
  return postOrder(hedgeClient, [HashZero], data);
}

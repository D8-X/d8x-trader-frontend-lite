import { createWalletClient, http, formatEther } from 'viem';

import { HashZero } from 'appConstants';
import { generateStrategyAccount } from 'blockchain-api/generateStrategyAccount';
import { orderDigest } from 'network/network';
import { OrderSideE, OrderTypeE } from 'types/enums';
import { HedgeConfigI, OrderI } from 'types/types';

import { postOrder } from './postOrder';
import { getBalance } from 'viem/actions';
import { transferFunds } from 'blockchain-api/transferFunds';
import { getGasPrice } from 'blockchain-api/getGasPrice';
// import { PROXY_ABI } from '@d8x/perpetuals-sdk';
// import { claimStrategyFunds } from './claimStrategyFunds';

const DEADLINE = 60 * 60; // 1 hour from posting time
const GAS_TARGET = 2_000_000n; // good for arbitrum

export async function exitStrategy({
  chainId,
  walletClient,
  symbol,
  traderAPI,
  limitPrice,
  strategyAddress,
}: HedgeConfigI) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const hedgeClient = await generateStrategyAccount(walletClient).then((account) =>
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
  const strategyAddr = strategyAddress ?? hedgeClient.account.address;
  const isDelegated = (await traderAPI
    .getReadOnlyProxyInstance()
    .isDelegate(strategyAddr, walletClient.account.address)) as boolean;
  const gasBalance = await getBalance(walletClient, { address: strategyAddr });
  const { data } = await orderDigest(chainId, [order], hedgeClient.account.address);
  if (isDelegated && hedgeClient === undefined) {
    return postOrder(walletClient, [HashZero], data);
  } else {
    const gasPrice = await getGasPrice(walletClient.chain?.id);
    if (gasBalance < GAS_TARGET * gasPrice) {
      await transferFunds(walletClient, strategyAddr, +formatEther(2n * GAS_TARGET * gasPrice));
    }
    return postOrder(hedgeClient, [HashZero], data);
  }
}

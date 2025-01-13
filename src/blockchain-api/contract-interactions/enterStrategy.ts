import { getMaxSignedPositionSize } from '@d8x/perpetuals-sdk';
import { type Config } from '@wagmi/core';
import { type SendTransactionMutateAsync } from '@wagmi/core/query';
import type { Dispatch, SetStateAction } from 'react';
import { type Address } from 'viem';

import { HashZero } from 'appConstants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { orderDigest } from 'network/network';
import { OrderSideE, OrderTypeE } from 'types/enums';
import type { HedgeConfigI, OrderI } from 'types/types';

import { postOrder } from './postOrder';
import { setDelegate } from './setDelegate';
import { fundStrategyGas } from './fundStrategyGas';
import { fundStrategyMargin } from './fundStrategyMargin';

const DEADLINE = 60 * 60; // 1 hour from posting time
const DELEGATE_INDEX = 2; // to be emitted
const PAGE_REFRESH_DELAY = 3_000; // Let's wait 3 sec before refresh

export async function enterStrategy(
  {
    chainId,
    walletClient,
    strategyClient,
    isMultisigAddress,
    symbol,
    traderAPI,
    amount,
    feeRate,
    indexPrice,
    limitPrice,
    strategyAddress,
  }: HedgeConfigI,
  sendTransactionAsync: SendTransactionMutateAsync<Config, unknown>,
  setCurrentPhaseKey: Dispatch<SetStateAction<string>>
): Promise<{
  hash?: Address;
  orderIds: string[];
  interrupted?: boolean;
  interruptedMessage?: string;
}> {
  if (!walletClient.account?.address || !amount || !feeRate) {
    throw new Error('Invalid arguments');
  }

  let strategyAddr: Address;
  if (!strategyAddress) {
    strategyAddr = strategyClient.account!.address;
  } else {
    strategyAddr = strategyAddress;
  }
  const isDelegated = (await traderAPI
    .getReadOnlyProxyInstance()
    .isDelegate(strategyAddr, walletClient.account.address)) as boolean;

  const settleTokenAddr = traderAPI.getSettlementTokenFromSymbol(symbol) as Address | undefined;
  const settleTokenDec = traderAPI.getSettlementTokenDecimalsFromSymbol(symbol);
  const position = await traderAPI
    .positionRisk(strategyAddr, symbol)
    .then((pos) => pos[0])
    .catch(() => undefined);
  if (!position || !settleTokenAddr || !settleTokenDec) {
    //console.log({ position, settleTokenAddr, settleTokenDec });
    throw new Error(`No hedging strategy available for symbol ${symbol} on chain ID ${chainId}`);
  }

  if (position.positionNotionalBaseCCY !== 0) {
    throw new Error(
      `A hedging position already exists for trader ${walletClient.account?.address} symbol ${symbol} on chain ID ${chainId}`
    );
  }

  const orderSize = getMaxSignedPositionSize(
    amount, // margin collateral
    0, // current position
    0, // current locked-in value
    -1, // trade direction
    limitPrice ?? position.markPrice, // limit price
    (indexPrice ?? position.markPrice) / position.markPrice, // margin rate
    feeRate * 1e-5, // fee rate
    position.markPrice, // mark price
    indexPrice ?? position.markPrice, // index price
    position.collToQuoteConversion // collateral price
  );

  const order: OrderI = {
    symbol: symbol,
    side: OrderSideE.Sell,
    type: OrderTypeE.Market,
    quantity: Math.abs(orderSize * 0.96),
    limitPrice: limitPrice,
    leverage: (0.99 * position.markPrice) / (indexPrice ?? position.markPrice),
    executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
    deadline: Math.floor(Date.now() / 1000 + DEADLINE),
  };
  const { data } = await orderDigest(chainId, [order], strategyAddr);

  if (!data.digests || data.digests.length === 0) {
    console.error('orderDigest error:', data.error);
    setTimeout(() => {
      window.location.reload();
    }, PAGE_REFRESH_DELAY);
    throw new Error('An error appeared to enter a strategy. Please wait for page refresh.');
  }

  // now we start sending txns --> need to generate strat wallet
  await fundStrategyGas(
    { walletClient, strategyClient, strategyAddress: strategyAddr, isMultisigAddress },
    sendTransactionAsync,
    setCurrentPhaseKey
  );

  // set user as delegate of strat wallet
  if (!isDelegated) {
    await setDelegate(
      strategyClient,
      traderAPI.getProxyAddress() as Address,
      walletClient.account.address,
      DELEGATE_INDEX
    );
  }
  // send collateral to strat wallet
  await fundStrategyMargin(
    {
      walletClient,
      strategyClient,
      strategyAddress: strategyAddr,
      amount,
      settleTokenAddress: settleTokenAddr,
      isMultisigAddress,
    },
    setCurrentPhaseKey
  );
  // increase allowance if needed
  await approveMarginToken({
    walletClient: strategyClient,
    settleTokenAddr,
    isMultisigAddress,
    proxyAddr: traderAPI.getProxyAddress(),
    minAmount: amount,
    decimals: settleTokenDec,
  }).catch((error) => {
    //console.log(error);
    throw new Error(error.shortMessage);
  });

  // post order
  setCurrentPhaseKey('pages.strategies.enter.phases.posting');
  return postOrder(strategyClient, traderAPI, {
    traderAddr: strategyAddr,
    orders: [order],
    signatures: [HashZero],
    brokerData: data,
  });
}

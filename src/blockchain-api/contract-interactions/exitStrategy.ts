import { type Config } from '@wagmi/core';
import { type SendTransactionMutateAsync } from '@wagmi/core/query';
import type { Dispatch, SetStateAction } from 'react';

import { HashZero } from 'appConstants';
import { orderDigest } from 'network/network';
import { OrderSideE, OrderTypeE } from 'types/enums';
import { HedgeConfigI, OrderI } from 'types/types';

import { postOrder } from './postOrder';
import { fundStrategyGas } from './fundStrategyGas';

const DEADLINE = 60 * 60; // 1 hour from posting time

export async function exitStrategy(
  {
    chainId,
    walletClient,
    strategyClient,
    isMultisigAddress,
    symbol,
    traderAPI,
    limitPrice,
    strategyAddress,
  }: HedgeConfigI,
  sendTransactionAsync: SendTransactionMutateAsync<Config, unknown>,
  setCurrentPhaseKey: Dispatch<SetStateAction<string>>
) {
  if (!walletClient.account?.address || !strategyClient.account?.address) {
    throw new Error('Account not connected');
  }

  //console.log('exit: fetch data');
  const position = await traderAPI
    .positionRisk(strategyClient.account.address, symbol)
    .then((pos) => pos[0])
    .catch(() => undefined);
  if (!position) {
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
  const strategyAddr = strategyAddress ?? strategyClient.account.address;
  const isDelegated = (await traderAPI
    .getReadOnlyProxyInstance()
    .isDelegate(strategyAddr, walletClient.account.address)) as boolean;
  const { data } = await orderDigest(chainId, [order], strategyClient.account.address);

  if (isDelegated) {
    //console.log('exit: post via user wallet');
    setCurrentPhaseKey('pages.strategies.exit.phases.posting');
    return postOrder(walletClient, traderAPI, {
      traderAddr: strategyAddr,
      orders: [order],
      signatures: [HashZero],
      brokerData: data,
    });
  } else {
    await fundStrategyGas(
      { walletClient, strategyClient, strategyAddress: strategyAddr, isMultisigAddress },
      sendTransactionAsync,
      setCurrentPhaseKey
    );
    //console.log('exit: post via strat wallet');
    setCurrentPhaseKey('pages.strategies.exit.phases.posting');
    return postOrder(strategyClient, traderAPI, {
      traderAddr: strategyAddr,
      orders: [order],
      signatures: [HashZero],
      brokerData: data,
    });
  }
}

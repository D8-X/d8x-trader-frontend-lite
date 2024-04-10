import { getMaxSignedPositionSize } from '@d8x/perpetuals-sdk';
import { type Config } from '@wagmi/core';
import { type SendTransactionMutateAsync } from '@wagmi/core/query';
import {
  createWalletClient,
  type Address,
  http,
  erc20Abi,
  parseUnits,
  WalletClient,
  Transport,
  Chain,
  Account,
} from 'viem';
import { getBalance, readContract, writeContract } from 'viem/actions';

import { HashZero } from 'appConstants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { generateStrategyAccount } from 'blockchain-api/generateStrategyAccount';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { orderDigest } from 'network/network';
import { OrderSideE, OrderTypeE } from 'types/enums';
import { HedgeConfigI, OrderI } from 'types/types';

import { postOrder } from './postOrder';
import { setDelegate } from './setDelegate';

const DEADLINE = 60 * 60; // 1 hour from posting time
const DELEGATE_INDEX = 2; // to be emitted
const GAS_TARGET = 2_000_000n; // good for arbitrum

export async function enterStrategy(
  { chainId, walletClient, symbol, traderAPI, amount, feeRate, indexPrice, limitPrice, strategyAddress }: HedgeConfigI,
  sendTransactionAsync: SendTransactionMutateAsync<Config, unknown>
): Promise<{
  hash?: Address;
  interrupted?: boolean;
  interruptedMessage?: string;
}> {
  if (!walletClient.account?.address || !amount || !feeRate) {
    throw new Error('Invalid arguments');
  }

  let strategyAddr: Address;
  let hedgeClient: WalletClient<Transport, Chain | undefined, Account> | undefined = undefined;
  if (!strategyAddress) {
    hedgeClient = await generateStrategyAccount(walletClient).then((account) =>
      createWalletClient({
        account,
        chain: walletClient.chain,
        transport: http(),
      })
    );
    strategyAddr = hedgeClient!.account!.address;
  } else {
    strategyAddr = strategyAddress;
  }
  const isDelegated = (await traderAPI
    .getReadOnlyProxyInstance()
    .isDelegate(strategyAddr, walletClient.account.address)) as boolean;

  const marginTokenAddr = traderAPI.getMarginTokenFromSymbol(symbol);
  const marginTokenDec = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const position = await traderAPI
    .positionRisk(strategyAddr, symbol)
    .then((pos) => pos[0])
    .catch(() => undefined);
  if (!position || !marginTokenAddr || !marginTokenDec) {
    //console.log({ position, marginTokenAddr, marginTokenDec });
    throw new Error(`No hedging strategy available for symbol ${symbol} on chain ID ${chainId}`);
  }
  const gasBalance = await getBalance(walletClient, { address: strategyAddr });
  const marginTokenBalance = await readContract(walletClient, {
    address: marginTokenAddr as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [strategyAddr],
  });
  const allowance = await readContract(walletClient, {
    address: marginTokenAddr as Address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [strategyAddr, traderAPI.getProxyAddress() as Address],
  });

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
    quantity: Math.abs(orderSize),
    limitPrice: limitPrice,
    leverage: position.markPrice / (indexPrice ?? position.markPrice),
    executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
    deadline: Math.floor(Date.now() / 1000 + DEADLINE),
  };
  const { data } = await orderDigest(chainId, [order], strategyAddr);

  if (!data.digests || data.digests.length === 0) {
    console.error('orderDigest error:', data.error);
    throw new Error('An error appeared to enter a strategy');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);

  if (!isDelegated) {
    if (gasBalance < GAS_TARGET * gasPrice) {
      await sendTransactionAsync({
        account: walletClient.account,
        chainId: walletClient.chain?.id,
        to: strategyAddr,
        value: GAS_TARGET * gasPrice,
      });
    }
    if (hedgeClient === undefined) {
      hedgeClient = await generateStrategyAccount(walletClient).then((account) =>
        createWalletClient({
          account,
          chain: walletClient.chain,
          transport: http(),
        })
      );
    }
    await setDelegate(
      hedgeClient!,
      traderAPI.getProxyAddress() as Address,
      walletClient.account.address,
      DELEGATE_INDEX
    );
  }

  const amountBigint = parseUnits(amount.toString(), marginTokenDec);
  if (marginTokenBalance < amountBigint) {
    //console.log('funding strategy account');
    await writeContract(walletClient, {
      address: marginTokenAddr as Address,
      chain: walletClient.chain,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [strategyAddr, amountBigint],
      account: walletClient.account,
    }).catch((error) => {
      //console.log(error);
      throw new Error(error.shortMessage);
    });
  }
  if (allowance < amountBigint) {
    //console.log('approving margin token', { marginTokenAddr, amount });
    if (hedgeClient === undefined) {
      hedgeClient = await generateStrategyAccount(walletClient).then((account) =>
        createWalletClient({
          account,
          chain: walletClient.chain,
          transport: http(),
        })
      );
    }
    await approveMarginToken(hedgeClient!, marginTokenAddr, traderAPI.getProxyAddress(), amount, marginTokenDec).catch(
      (error) => {
        //console.log(error);
        throw new Error(error.shortMessage);
      }
    );
  }

  //console.log('posting order');
  if (isDelegated && hedgeClient === undefined) {
    return postOrder(walletClient, [HashZero], data);
  } else {
    if (gasBalance < GAS_TARGET * gasPrice) {
      await sendTransactionAsync({
        account: walletClient.account,
        chainId: walletClient.chain?.id,
        to: strategyAddr,
        value: 2n * GAS_TARGET * gasPrice,
      });
    }
    if (hedgeClient === undefined) {
      hedgeClient = await generateStrategyAccount(walletClient).then((account) =>
        createWalletClient({
          account,
          chain: walletClient.chain,
          transport: http(),
        })
      );
    }
    return postOrder(hedgeClient!, [HashZero], data);
  }
}

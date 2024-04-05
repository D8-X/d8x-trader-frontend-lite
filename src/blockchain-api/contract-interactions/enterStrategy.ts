import { getMaxSignedPositionSize } from '@d8x/perpetuals-sdk';
import {
  createWalletClient,
  type Address,
  http,
  erc20Abi,
  parseUnits,
  formatEther,
  WalletClient,
  Transport,
  Chain,
  Account,
} from 'viem';

import { HashZero } from 'appConstants';
import { generateStrategyAccount } from 'blockchain-api/generateStrategyAccount';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { orderDigest } from 'network/network';
import { OrderSideE, OrderTypeE } from 'types/enums';
import { HedgeConfigI, OrderI } from 'types/types';

import { postOrder } from './postOrder';
import { getBalance, readContract, writeContract } from 'viem/actions';
import { setDelegate } from './setDelegate';
import { transferFunds } from 'blockchain-api/transferFunds';
import { getGasPrice } from 'blockchain-api/getGasPrice';

const DEADLINE = 60 * 60; // 1 hour from posting time
const DELEGATE_INDEX = 2; // to be emitted
const GAS_TARGET = 2_000_000n; // good for arbitrum

export async function enterStrategy({
  chainId,
  walletClient,
  symbol,
  traderAPI,
  amount,
  feeRate,
  indexPrice,
  limitPrice,
  strategyAddress,
}: HedgeConfigI): Promise<{ hash: Address }> {
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
    console.log(position, marginTokenAddr, marginTokenDec);
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
    1, // margin rate
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
    leverage: 1,
    executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
    deadline: Math.floor(Date.now() / 1000 + DEADLINE),
  };
  const { data } = await orderDigest(chainId, [order], strategyAddr);

  if (!data.digests || data.digests.length === 0) {
    return { hash: '0x' };
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);

  if (!isDelegated) {
    if (gasBalance < GAS_TARGET * gasPrice) {
      await transferFunds(walletClient, strategyAddr, +formatEther(GAS_TARGET * gasPrice));
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
    console.log('funding strategy account');
    await writeContract(walletClient, {
      address: marginTokenAddr as Address,
      chain: walletClient.chain,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [strategyAddr, amountBigint],
      account: walletClient.account,
    });
  }
  if (allowance < amountBigint) {
    console.log('appproving margin token', marginTokenAddr, amount);
    if (hedgeClient === undefined) {
      hedgeClient = await generateStrategyAccount(walletClient).then((account) =>
        createWalletClient({
          account,
          chain: walletClient.chain,
          transport: http(),
        })
      );
    }
    await approveMarginToken(hedgeClient!, marginTokenAddr, traderAPI.getProxyAddress(), amount, marginTokenDec);
  }

  console.log('posting order');
  if (isDelegated && hedgeClient === undefined) {
    return postOrder(walletClient, [HashZero], data);
  } else {
    if (gasBalance < GAS_TARGET * gasPrice) {
      await transferFunds(walletClient, strategyAddr, +formatEther(2n * GAS_TARGET * gasPrice));
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

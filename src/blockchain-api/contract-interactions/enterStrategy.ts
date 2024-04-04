import { getMaxSignedPositionSize } from '@d8x/perpetuals-sdk';
import { createWalletClient, type Address, http, erc20Abi, parseUnits } from 'viem';

import { HashZero } from 'appConstants';
import { generateStrategyAccount } from 'blockchain-api/generateStrategyAccount';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { orderDigest } from 'network/network';
import { OrderSideE, OrderTypeE } from 'types/enums';
import { HedgeConfigI, OrderI } from 'types/types';

import { postOrder } from './postOrder';
import { writeContract } from 'viem/actions';
import { setDelegate } from './setDelegate';

const DEADLINE = 60 * 60; // 1 hour from posting time
const DELEGATE_INDEX = 2; // to be emitted

export async function enterStrategy({
  chainId,
  walletClient,
  symbol,
  traderAPI,
  amount,
  feeRate,
  indexPrice,
  limitPrice,
}: HedgeConfigI): Promise<{ hash: Address }> {
  if (!walletClient.account?.address || !amount || !feeRate) {
    throw new Error('Invalid arguments');
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
    console.log(position, marginTokenAddr, marginTokenDec);
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
    1, // margin rate
    feeRate, // fee rate
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
  const { data } = await orderDigest(chainId, [order], hedgeClient.account.address);

  if (!data.digests || data.digests.length === 0) {
    return { hash: '0x' };
  }
  await setDelegate(hedgeClient, traderAPI.getProxyAddress() as Address, walletClient.account.address, DELEGATE_INDEX);
  console.log('appproving margin token', marginTokenAddr, amount);
  await approveMarginToken(hedgeClient, marginTokenAddr, traderAPI.getProxyAddress(), amount, marginTokenDec);
  console.log('funding strategy account');
  await writeContract(walletClient, {
    address: marginTokenAddr as Address,
    chain: walletClient.chain,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [hedgeClient.account.address, parseUnits(amount.toString(), marginTokenDec)],
    account: walletClient.account,
  });
  console.log('posting order');
  return postOrder(hedgeClient, [HashZero], data);
}

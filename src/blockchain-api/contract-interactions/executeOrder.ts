import { encodeFunctionData, zeroAddress } from 'viem';

import { TraderInterface } from '@d8x/perpetuals-sdk';
import { orderBookAbi } from 'blockchain-api/abi/orderBookAbi';
import { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';
import { updatePriceFeeds } from './updatePriceFeeds';

export async function executeOrders(
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  symbol: string,
  orderIds: `0x${string}`[],
  submittedTimestamp: bigint
) {
  await updatePriceFeeds({
    traderApi: traderAPI,
    sendTransaction,
    symbol,
    submittedTimestamp,
  });

  const txData2 = encodeFunctionData({
    abi: orderBookAbi,
    functionName: 'executeOrders',
    args: [orderIds, zeroAddress, [], []],
  });

  return sendTransaction(
    {
      chainId: Number(traderAPI.chainId),
      to: traderAPI.getOrderBookAddress(symbol),
      data: txData2,
      gasLimit: 1_000_000n,
    },
    { sponsor: hasPaymaster(Number(traderAPI.chainId)) }
  );
}

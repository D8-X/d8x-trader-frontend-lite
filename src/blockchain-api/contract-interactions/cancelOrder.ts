import { encodeFunctionData, type Address } from 'viem';

import { TraderInterface } from '@d8x/perpetuals-sdk';
import { orderBookAbi } from 'blockchain-api/abi/orderBookAbi';
import { SendTransactionCallT, type CancelOrderResponseI } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';
import { updatePriceFeeds } from './updatePriceFeeds';

export async function cancelOrder(
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  symbol: string,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string
): Promise<{ hash: Address }> {
  await updatePriceFeeds({
    traderApi: traderAPI,
    sendTransaction,
    symbol,
  });

  const txData2 = encodeFunctionData({
    abi: orderBookAbi,
    functionName: 'cancelOrder',
    args: [
      orderId as `0x${string}`,
      signature as `0x${string}`,
      [], //data.priceUpdate.publishTimes.map(() => '0x') as `0x${string}`[], //data.priceUpdate.updateData as `0x${string}`[],
      [], // data.priceUpdate.publishTimes.map((x) => BigInt(x - 1)),
    ],
  });

  return sendTransaction(
    {
      chainId: Number(traderAPI.chainId),
      to: data.OrderBookAddr as `0x${string}`,
      data: txData2,
      gasLimit: 1_000_000n,
    },
    { sponsor: hasPaymaster(Number(traderAPI.chainId)) }
  );
}

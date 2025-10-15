import { floatToABK64x64, PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import { encodeFunctionData, type Address } from 'viem';

import type { CollateralChangePropsI, SendTransactionCallT } from 'types/types';
import { updatePriceFeeds } from './updatePriceFeeds';

export async function withdraw(
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  { traderAddr, symbol, amount }: CollateralChangePropsI
): Promise<{ hash: Address }> {
  await updatePriceFeeds({
    traderApi: traderAPI,
    sendTransaction,
    symbol,
  });

  const txData2 = encodeFunctionData({
    abi: PROXY_ABI,
    functionName: 'withdraw',
    args: [
      traderAPI.getPerpetualStaticInfo(symbol).id,
      traderAddr,
      floatToABK64x64(amount),
      [], //vaas,
      [], //timestamps,
    ],
  });

  return sendTransaction({
    chainId: Number(traderAPI.chainId),
    to: traderAPI.getProxyAddress() as Address,
    data: txData2,
  });
}

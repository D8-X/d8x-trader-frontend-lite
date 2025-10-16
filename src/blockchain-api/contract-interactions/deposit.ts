import { floatToABK64x64, PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import { encodeFunctionData, type Address } from 'viem';

import type { CollateralChangePropsI, SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';
import { updatePriceFeeds } from './updatePriceFeeds';

export async function deposit(
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  { traderAddr, symbol, amount }: CollateralChangePropsI
): Promise<{ hash: Address }> {
  const decimals = traderAPI.getSettlementTokenDecimalsFromSymbol(symbol);
  if (!decimals) {
    throw new Error(`no settlement token information found for symbol ${symbol}`);
  }

  await updatePriceFeeds({
    traderApi: traderAPI,
    sendTransaction,
    symbol,
  });

  const txData2 = encodeFunctionData({
    abi: PROXY_ABI,
    functionName: 'deposit',
    args: [
      traderAPI.getPerpetualStaticInfo(symbol).id,
      traderAddr,
      floatToABK64x64(amount),
      [], //pxUpdate.submission.priceFeedVaas,
      [], //pxUpdate.submission.timestamps,
    ],
  });

  const chainId = Number(traderAPI.chainId);

  return sendTransaction(
    {
      chainId,
      to: traderAPI.getProxyAddress() as Address,
      data: txData2,
      gasLimit: 1_000_000n,
    },
    { sponsor: hasPaymaster(chainId) }
  );
}

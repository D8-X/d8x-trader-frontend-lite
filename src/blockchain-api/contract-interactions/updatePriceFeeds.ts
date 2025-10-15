import { PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import { waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';
import { encodeFunctionData } from 'viem';

export async function updatePriceFeeds({
  traderApi,
  sendTransaction,
  symbol,
  feesPerGas,
}: {
  traderApi: TraderInterface;
  sendTransaction: SendTransactionCallT;
  symbol: string;
  feesPerGas?:
    | {
        gasPrice: undefined;
        maxFeePerGas: bigint;
        maxPriorityFeePerGas: bigint;
      }
    | {
        gasPrice: bigint;
        maxFeePerGas: undefined;
        maxPriorityFeePerGas: undefined;
      };
}) {
  const pxUpdates = await traderApi.fetchPriceSubmissionInfoForPerpetual(symbol);

  const txParams = {
    chainId: Number(traderApi.chainId),
    to: traderApi.getProxyAddress(),
    data: encodeFunctionData({
      abi: PROXY_ABI,
      functionName: 'updatePriceFeeds',
      args: [
        traderApi.getPerpIdFromSymbol(symbol)!,
        pxUpdates.submission.priceFeedVaas,
        pxUpdates.submission.timestamps,
        60,
      ],
    }),
    ...feesPerGas,
  };

  const txHash = await sendTransaction(txParams, { sponsor: hasPaymaster(Number(traderApi.chainId)) })
    .then(({ hash }) => hash)
    .catch();

  if (txHash !== undefined) {
    await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
      .then()
      .catch((e) => {
        console.log('pyth confirmation error', e);
      });
  }
}

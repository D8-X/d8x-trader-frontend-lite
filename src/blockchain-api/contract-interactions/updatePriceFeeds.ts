import { PriceFeedSubmission, PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import { waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';
import { encodeFunctionData } from 'viem';

const MAX_RETRY_COUNT = 10;

export async function updatePriceFeeds({
  traderApi,
  sendTransaction,
  symbol,
  feesPerGas,
  confirmations,
  submittedTimestamp,
}: {
  traderApi: TraderInterface;
  sendTransaction: SendTransactionCallT;
  symbol: string;
  confirmations?: number;
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
  submittedTimestamp?: bigint;
}) {
  const minTimestamp = submittedTimestamp || 0n;
  let oracleTimestamp = -1n;

  let pxUpdates:
    | {
        submission: PriceFeedSubmission;
        pxS2S3: [number, number];
      }
    | undefined;

  let count = 0;

  while (oracleTimestamp <= minTimestamp && count < MAX_RETRY_COUNT) {
    console.log('outdated oracles:', oracleTimestamp, '<=', minTimestamp, minTimestamp - oracleTimestamp);
    count++;
    pxUpdates = await traderApi.fetchPriceSubmissionInfoForPerpetual(symbol).catch(() => undefined);
    if (pxUpdates && pxUpdates.submission.timestamps.length > 0) {
      oracleTimestamp = BigInt(Math.min(...pxUpdates.submission.timestamps));
    }
  }

  if (!pxUpdates) {
    return;
  }

  console.log({ oracleTimestamp });

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
    gasLimit: 500_000n,
  };

  const txHash = await sendTransaction(txParams, { sponsor: hasPaymaster(Number(traderApi.chainId)) })
    .then(({ hash }) => hash)
    .catch(() => undefined);

  if (txHash !== undefined) {
    await waitForTransactionReceipt(wagmiConfig, { hash: txHash, confirmations })
      .then()
      .catch((e) => {
        console.log('pyth confirmation error', e);
      });
  }
}

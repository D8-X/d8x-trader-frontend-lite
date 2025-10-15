import { TraderInterface } from '@d8x/perpetuals-sdk';
import { waitForTransactionReceipt } from '@wagmi/core';
import { pythAbi } from 'blockchain-api/abi/pyth';
import { getUpdateFee } from 'blockchain-api/pyth/getUpdateFee';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { getPriceUpdates } from 'network/prices';
import { SendTransactionCallT } from 'types/types';
import { encodeFunctionData } from 'viem';

export async function updatePyth({
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
  // let txNonce = await walletClient.account.getNonce?.()?.then((n) => Number(n));
  let txHash: `0x${string}` | undefined;

  const pxUpdates = await getPriceUpdates(traderApi, symbol);

  for (const pxUpdate of pxUpdates) {
    try {
      const txParams = {
        chainId: Number(traderApi.chainId),
        to: pxUpdate.address,
        value: await getUpdateFee(pxUpdate.address, pxUpdate.updateData),
        data: encodeFunctionData({
          abi: pythAbi,
          functionName: 'updatePriceFeeds',
          args: [pxUpdate.updateData], // [[pxUpdate.updateData], pxUpdate.ids, pxUpdate.publishTimes],
        }),
        gas: 500_000n,
        ...feesPerGas,
      };
      txHash = await sendTransaction(txParams, { sponsor: true }).then(({ hash }) => hash);
    } catch (e) {
      console.log('pyth error', e);
      continue;
    }
  }
  // txns were submitted in order, wait until last accepted one is mined
  if (txHash !== undefined) {
    await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
      .then()
      .catch((e) => {
        console.log('pyth confirmation error', e);
      });
  }
}

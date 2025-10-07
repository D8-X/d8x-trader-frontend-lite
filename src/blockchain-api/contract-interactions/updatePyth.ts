import { TraderInterface } from '@d8x/perpetuals-sdk';
import { pythAbi } from 'blockchain-api/abi/pyth';
import { getPriceUpdates } from 'network/prices';
import { SmartAccountClient } from 'permissionless';
import { encodeFunctionData, WalletClient } from 'viem';
import { sendTransaction, waitForTransactionReceipt } from 'viem/actions';

export async function updatePyth({
  traderApi,
  walletClient,
  symbol,
  feesPerGas,
}: {
  traderApi: TraderInterface;
  walletClient: WalletClient | SmartAccountClient;
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
  if (!walletClient.account?.address || !walletClient.transport || !walletClient.chain) {
    throw new Error('account not connected');
  }
  let txNonce = await walletClient.account.getNonce?.()?.then((n) => Number(n));
  let txHash: `0x${string}` | undefined;

  const pxUpdates = await getPriceUpdates(traderApi, symbol);

  for (const pxUpdate of pxUpdates) {
    const txData1 = encodeFunctionData({
      abi: pythAbi,
      functionName: 'updatePriceFeedsIfNecessary',
      args: [[pxUpdate.updateData], pxUpdate.ids, pxUpdate.publishTimes],
    });

    try {
      txHash = await sendTransaction(walletClient!, {
        account: walletClient.account,
        chain: walletClient.chain,
        to: pxUpdate.address,
        from: walletClient.account.address,
        value: 1n, //BigInt(priceData.updateFee),
        data: txData1,
        nonce: txNonce,
        gas: 500_000n,
        ...feesPerGas,
      });

      if (txNonce) {
        txNonce++;
      }
    } catch (e) {
      console.log('pyth error', e);
      continue;
    }
  }
  // txns were submitted in order, wait until last accepted one is mined
  if (txHash !== undefined) {
    await waitForTransactionReceipt(walletClient, { hash: txHash })
      .then()
      .catch((e) => {
        console.log('pyth confirmation error', e);
      });
  }
}

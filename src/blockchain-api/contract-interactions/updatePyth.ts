import { pythAbi } from 'blockchain-api/abi/pyth';
import { SmartAccountClient } from 'permissionless';
import { PriceUpdatesI } from 'types/types';
import { encodeFunctionData, WalletClient } from 'viem';
import { sendTransaction, waitForTransactionReceipt } from 'viem/actions';

export async function updatePyth({
  priceData,
  walletClient,
  feesPerGas,
  nonce,
}: {
  walletClient: WalletClient | SmartAccountClient;
  priceData: PriceUpdatesI;
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
  nonce?: number;
}) {
  if (!walletClient.account?.address || !walletClient.transport) {
    throw new Error('account not connected');
  }

  console.log(priceData);

  // update one by one
  // TODO: can do this in one go, but it also has to be queried from the api in one go
  // (currently price updates are queried one by one from the api)

  const txNonce = nonce ?? Number(await walletClient?.account?.getNonce?.());

  for (let idx = 0; idx < priceData.ids.length; idx++) {
    const txData1 = encodeFunctionData({
      abi: pythAbi,
      functionName: 'updatePriceFeedsIfNecessary',
      args: [
        [priceData.updateData[idx]] as `0x${string}`[],
        [priceData.ids[idx]] as `0x${string}`[],
        [BigInt(priceData.publishTimes[idx])],
      ],
    });

    console.log({
      txData1,
      priceData: priceData.updateData,
      from: walletClient.account.address,
    });

    try {
      const tx = await sendTransaction(walletClient!, {
        account: walletClient.account,
        chain: walletClient.chain,
        to: '0x2880aB155794e7179c9eE2e38200202908C17B43',
        from: walletClient.account.address,
        value: 1n, //BigInt(priceData.updateFee),
        data: txData1,
        nonce: txNonce + idx,
        gas: 500_000n,
        ...feesPerGas,
      });

      await waitForTransactionReceipt(walletClient, { hash: tx })
        .then()
        .catch((e) => {
          console.log('pyth confirmation error', e);
        });
    } catch (e) {
      console.log('pyth error', e);
      continue;
    }
  }
}

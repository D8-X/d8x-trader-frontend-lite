import { pythAbi } from 'blockchain-api/abi/pyth';
import { SmartAccountClient } from 'permissionless';
import { PriceUpdatesI } from 'types/types';
import { encodeFunctionData, WalletClient } from 'viem';
import { sendTransaction, waitForTransactionReceipt } from 'viem/actions';

export async function updatePyth({
  priceData,
  walletClient,
  nonce,
  feesPerGas,
}: {
  walletClient: WalletClient | SmartAccountClient;
  priceData: PriceUpdatesI;
  nonce?: number;
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
  if (!walletClient.account?.address || !walletClient.transport) {
    throw new Error('account not connected');
  }
  const txData1 = encodeFunctionData({
    abi: pythAbi,
    functionName: 'updatePriceFeedsIfNecessary',
    args: [
      [priceData.updateData[0]] as `0x${string}`[],
      priceData.ids as `0x${string}`[],
      priceData.publishTimes.map((x) => BigInt(x)),
    ],
  });

  console.log({
    txData1,
    priceData: priceData.updateData,
    from: walletClient.account.address,
  });

  return sendTransaction(walletClient, {
    account: walletClient.account,
    chain: walletClient.chain,
    to: '0x2880aB155794e7179c9eE2e38200202908C17B43',
    from: walletClient.account.address,
    value: BigInt(priceData.updateFee),
    data: txData1,
    nonce,
    ...feesPerGas,
  })
    .then(async (tx) => {
      await waitForTransactionReceipt(walletClient, { hash: tx }).catch((e) => {
        console.log('pyth confirmation error', e);
      });
    })
    .catch((e) => {
      console.log('pyth error', e);
    });
}

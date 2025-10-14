import { TraderInterface } from '@d8x/perpetuals-sdk';
import { pythAbi } from 'blockchain-api/abi/pyth';
import { getUpdateFee } from 'blockchain-api/pyth/getUpdateFee';
import { getPriceUpdates } from 'network/prices';
import { type SmartAccountClient } from 'permissionless';
import { Account, Chain, Client, encodeFunctionData, Transport, type WalletClient } from 'viem';
import { SmartAccount } from 'viem/account-abstraction';
import { sendTransaction, waitForTransactionReceipt } from 'viem/actions';

export async function updatePyth({
  traderApi,
  walletClient,
  symbol,
  feesPerGas,
}: {
  traderApi: TraderInterface;
  walletClient: SmartAccountClient<Transport, Chain, SmartAccount, Client> | WalletClient<Transport, Chain, Account>;
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
    try {
      const txParams = {
        account: walletClient.account.address,
        chain: walletClient.chain,
        to: pxUpdate.address,
        value: await getUpdateFee(pxUpdate.address, pxUpdate.updateData),
        data: encodeFunctionData({
          abi: pythAbi,
          functionName: 'updatePriceFeeds',
          args: [pxUpdate.updateData], // [[pxUpdate.updateData], pxUpdate.ids, pxUpdate.publishTimes],
        }),
        nonce: txNonce,
        gas: 500_000n,
        ...feesPerGas,
      };
      txHash =
        walletClient.key !== 'bundler'
          ? await sendTransaction(walletClient as WalletClient, txParams)
          : await (walletClient as SmartAccountClient).sendTransaction(txParams);

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

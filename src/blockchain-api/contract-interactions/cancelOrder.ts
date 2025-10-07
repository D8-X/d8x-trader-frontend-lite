import { encodeFunctionData, type Address, type WalletClient } from 'viem';

import { TraderInterface } from '@d8x/perpetuals-sdk';
import { orderBookAbi } from 'blockchain-api/abi/orderBookAbi';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { SmartAccountClient } from 'permissionless';
import { type CancelOrderResponseI } from 'types/types';
import { sendTransaction } from 'viem/actions';
import { updatePyth } from './updatePyth';

export async function cancelOrder(
  traderAPI: TraderInterface,
  walletClient: WalletClient | SmartAccountClient,
  symbol: string,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string
): Promise<{ hash: Address }> {
  if (!walletClient.account?.address) {
    throw new Error('account not connected');
  }
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  await updatePyth({
    traderApi: traderAPI,
    walletClient,
    symbol,
    feesPerGas,
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

  return sendTransaction(walletClient!, {
    account: walletClient.account,
    chain: walletClient.chain,
    to: data.OrderBookAddr as `0x${string}`,
    from: walletClient.account.address,
    // value: BigInt(data.priceUpdate.updateFee),
    data: txData2,
    // nonce,
    gas: 2_000_000n,
    ...feesPerGas,
  }).then((tx) => ({ hash: tx }));

  // return walletClient.writeContract(baseParams).then((tx) => ({ hash: tx }));
}

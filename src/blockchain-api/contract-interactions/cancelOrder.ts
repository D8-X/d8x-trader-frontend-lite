import { encodeFunctionData, type Address, type WalletClient } from 'viem';

import { orderBookAbi } from 'blockchain-api/abi/orderBookAbi';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { SmartAccountClient } from 'permissionless';
import { type CancelOrderResponseI } from 'types/types';
import { sendTransaction } from 'viem/actions';
import { updatePyth } from './updatePyth';

export async function cancelOrder(
  walletClient: WalletClient | SmartAccountClient,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string,
  nonce?: number
): Promise<{ hash: Address }> {
  if (!walletClient.account?.address) {
    throw new Error('account not connected');
  }
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  // const estimateParams: EstimateContractGasParameters = {
  //   address: data.OrderBookAddr as Address,
  //   abi: orderBookAbi,
  //   functionName: 'cancelOrder',
  //   args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
  //   value: BigInt(data.priceUpdate.updateFee),
  //   nonce,
  //   account: walletClient.account,
  //   ...feesPerGas,
  // };

  // const gasLimit = await estimateContractGas(walletClient, estimateParams)
  //   .then((gas) => (gas * 130n) / 100n)
  //   .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));
  // const baseParams = {
  //   ...estimateParams,
  //   chain: walletClient.chain,
  //   account: walletClient.account,
  //   gas: gasLimit,
  //   // };

  await updatePyth({ walletClient, priceData: data.priceUpdate, nonce });

  const txData2 = encodeFunctionData({
    abi: orderBookAbi,
    functionName: 'cancelOrder',
    args: [
      orderId as `0x${string}`,
      signature as `0x${string}`,
      data.priceUpdate.updateData as `0x${string}`[],
      data.priceUpdate.publishTimes.map((x) => BigInt(x)),
    ],
  });

  return sendTransaction(walletClient, {
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

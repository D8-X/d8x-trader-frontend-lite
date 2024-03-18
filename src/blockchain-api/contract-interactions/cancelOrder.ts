import { LOB_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { type CancelOrderResponseI } from 'types/types';
import { type Address, type WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

export async function cancelOrder(
  walletClient: WalletClient,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string
): Promise<{ hash: Address }> {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const params = {
    chain: walletClient.chain,
    address: data.OrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'cancelOrder',
    args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
    gasPrice: gasPrice,
    value: BigInt(data.priceUpdate.updateFee),
    account: walletClient.account,
  };
  const gasLimit = await estimateContractGas(walletClient, params);
  return walletClient.writeContract({ ...params, gas: (gasLimit * 110n) / 100n }).then((tx) => ({ hash: tx }));
}

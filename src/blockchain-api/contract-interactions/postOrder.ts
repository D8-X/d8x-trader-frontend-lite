import { LOB_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient } from 'viem';
import { type OrderDigestI } from 'types/types';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { estimateContractGas } from 'viem/actions';

export async function postOrder(
  walletClient: WalletClient,
  signatures: string[],
  data: OrderDigestI,
  doChain = true
): Promise<{ hash: Address }> {
  let orders: never[];
  if (doChain) {
    orders = TraderInterface.chainOrders(data.SCOrders, data.orderIds).map(
      TraderInterface.fromClientOrderToTypeSafeOrder
    ) as never[];
  } else {
    orders = data.SCOrders.map((o) => TraderInterface.fromSmartContratOrderToClientOrder(o)).map(
      TraderInterface.fromClientOrderToTypeSafeOrder
    ) as never[];
  }
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const params = {
    chain: walletClient.chain,
    address: data.OrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'postOrders',
    args: [orders, signatures],
    account: walletClient.account,
    gasPrice: gasPrice,
  };
  const gasLimit = await estimateContractGas(walletClient, params)
    .then((gas) => (gas * 150n) / 100n)
    .catch(() => 5_000_000n * BigInt(orders.length));

  return walletClient.writeContract({ ...params, gas: gasLimit }).then((tx) => ({ hash: tx }));
}

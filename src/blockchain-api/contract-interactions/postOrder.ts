import { type ClientOrder, LOB_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import { type Address, type WalletClient } from 'viem';
import { type OrderDigestI } from 'types/types';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';
import { orderSubmitted } from 'network/broker';

export async function postOrder(
  walletClient: WalletClient,
  signatures: string[],
  data: OrderDigestI,
  doChain = true
): Promise<{ hash: Address }> {
  let clientOrders: ClientOrder[];
  if (doChain) {
    clientOrders = TraderInterface.chainOrders(data.SCOrders, data.orderIds);
  } else {
    clientOrders = data.SCOrders.map((o) => TraderInterface.fromSmartContratOrderToClientOrder(o));
  }
  const orders = clientOrders.map((o) => {
    o.brokerSignature = o.brokerSignature || '0x';
    return TraderInterface.fromClientOrderToTypeSafeOrder(o);
  });
  if (!walletClient.account || walletClient?.chain === undefined) {
    throw new Error('account not connected');
  }
  const chain = walletClient.chain;
  const gasPrice = await getGasPrice(chain.id);
  const params = {
    chain,
    address: data.OrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'postOrders',
    args: [orders as never[], signatures],
    account: walletClient.account,
    gasPrice: gasPrice,
  };

  const gasLimit = await estimateContractGas(walletClient, params)
    .then((gas) => (gas * 150n) / 100n)
    .catch(() => getGasLimit({ chainId: chain.id, method: MethodE.Interact }) * BigInt(orders.length));
  return walletClient.writeContract({ ...params, gas: gasLimit }).then((tx) => {
    // success submitting order to the node - inform backend
    orderSubmitted(chain.id, data.orderIds).then().catch(console.error);
    return { hash: tx };
  });
}

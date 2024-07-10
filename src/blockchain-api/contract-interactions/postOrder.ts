import { LOB_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import { type Address, type WalletClient } from 'viem';
import { OrderI, type OrderDigestI } from 'types/types';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';
import { orderSubmitted } from 'network/broker';

export async function postOrder(
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  {
    orders,
    signatures,
    data,
    doChain,
  }: { orders: OrderI[]; signatures: string[]; data: OrderDigestI; doChain?: boolean }
): Promise<{ hash: Address }> {
  if (!walletClient.account || walletClient?.chain === undefined) {
    throw new Error('account not connected');
  }
  const traderAddr = data.SCOrders[0].traderAddr;
  const scOrders = orders.map((order, idx) => {
    const scOrder = traderAPI.createSmartContractOrder(order, traderAddr);
    scOrder.brokerAddr = data.SCOrders[idx].brokerAddr;
    scOrder.brokerFeeTbps = data.SCOrders[idx].brokerFeeTbps;
    scOrder.brokerSignature = data.SCOrders[idx].brokerSignature ?? '0x';
    return scOrder;
  });
  const clientOrders = doChain
    ? TraderInterface.chainOrders(scOrders, data.orderIds)
    : scOrders.map((o) => TraderInterface.fromSmartContratOrderToClientOrder(o));

  const chain = walletClient.chain;
  const gasPrice = await getGasPrice(chain.id);
  const params = {
    chain,
    address: data.OrderBookAddr as Address, // TODO: keep getting "wrong order book" ?
    abi: LOB_ABI,
    functionName: 'postOrders',
    args: [clientOrders as never[], signatures],
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

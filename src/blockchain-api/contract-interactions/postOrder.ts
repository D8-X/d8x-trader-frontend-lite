import { TraderInterface } from '@d8x/perpetuals-sdk';
import { EstimateContractGasParameters, WalletClient, type Address } from 'viem';

import { orderBookAbi } from 'blockchain-api/abi/orderBookAbi';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { orderSubmitted } from 'network/broker';
import { SmartAccountClient } from 'permissionless';
import type { OrderDigestI, OrderI } from 'types/types';

// const TMP_PAYMENT_TOKEN = '0x779Ded0c9e1022225f8E0630b35a9b54bE713736' as const;

export async function postOrder(
  walletClient: SmartAccountClient | WalletClient,
  traderAPI: TraderInterface,
  {
    traderAddr,
    orders,
    signatures,
    brokerData,
    doChain,
  }: { traderAddr: Address; orders: OrderI[]; signatures: string[]; brokerData: OrderDigestI; doChain?: boolean }
): Promise<{ hash: Address; orderIds: string[] }> {
  if (!walletClient.account || walletClient?.chain === undefined) {
    throw new Error('account not connected');
  }
  const scOrders = orders.map((order, idx) => {
    const scOrder = traderAPI.createSmartContractOrder(order, traderAddr);
    scOrder.brokerAddr = brokerData.brokerAddr;
    scOrder.brokerFeeTbps = brokerData.brokerFeeTbps;
    scOrder.brokerSignature = brokerData.brokerSignatures[idx] ?? '0x';
    return scOrder;
  });
  const clientOrders = doChain
    ? TraderInterface.chainOrders(scOrders, brokerData.orderIds)
    : scOrders.map((o) => TraderInterface.fromSmartContratOrderToClientOrder(o));

  const chain = walletClient.chain;

  const feesPerGas = await getFeesPerGas(chain.id);

  if (brokerData.OrderBookAddr !== traderAPI.getOrderBookAddress(orders[0].symbol)) {
    console.log({
      orderBook: orders[0].symbol,
      bakend: brokerData.OrderBookAddr,
      api: traderAPI.getOrderBookAddress(orders[0].symbol),
    });
  }

  const estimateParams: EstimateContractGasParameters = {
    address: traderAPI.getOrderBookAddress(orders[0].symbol) as Address,
    abi: orderBookAbi,
    functionName: 'postOrders',
    args: [clientOrders as never[], signatures],
    ...feesPerGas,
  };

  // const gasLimit = await estimateContractGas(walletClient, estimateParams)
  //   .then((gas) => (gas * 150n) / 100n)
  //   .catch(() => getGasLimit({ chainId: chain.id, method: MethodE.Interact }) * BigInt(orders.length));
  const baseParams = {
    ...estimateParams,
    account: walletClient.account,
    chain,
    // gas: gasLimit,
  };

  // const calls = [
  //   {
  //     account: walletClient.account,
  //     chain: walletClient.chain,
  //     to: traderAPI.getOrderBookAddress(orders[0].symbol) as Address,
  //     data: encodeFunctionData({
  //       abi: orderBookAbi,
  //       functionName: 'postOrders',
  //       args: [clientOrders as never[], signatures as `0x${string}`[]],
  //     }),
  //     value: 0n,
  //   },
  // ];

  // return walletClient.sendTransaction({ calls }).then((tx) => {
  //   // success submitting order to the node - inform backend
  //   orderSubmitted(chain.id, brokerData.orderIds).then().catch(console.error);
  //   return { hash: tx, orderIds: brokerData.orderIds };
  // });

  return walletClient.writeContract(baseParams).then((tx) => {
    // success submitting order to the node - inform backend
    orderSubmitted(chain.id, brokerData.orderIds).then().catch(console.error);
    return { hash: tx, orderIds: brokerData.orderIds };
  });
}

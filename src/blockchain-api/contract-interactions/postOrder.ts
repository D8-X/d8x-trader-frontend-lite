import { ORDER_TYPE_MARKET, TraderInterface } from '@d8x/perpetuals-sdk';
import { encodeFunctionData, type Address } from 'viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { orderBookAbi } from 'blockchain-api/abi/orderBookAbi';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { orderSubmitted } from 'network/broker';
import type { OrderDigestI, OrderI, SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';
import { executeOrders } from './executeOrder';

// const TMP_PAYMENT_TOKEN = '0x779Ded0c9e1022225f8E0630b35a9b54bE713736' as const;

export async function postOrder(
  chainId: number,
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  {
    traderAddr,
    orders,
    signatures,
    brokerData,
    doChain,
  }: { traderAddr: Address; orders: OrderI[]; signatures: string[]; brokerData: OrderDigestI; doChain?: boolean }
): Promise<{ hash: Address; orderIds: string[] }> {
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

  if (brokerData.OrderBookAddr !== traderAPI.getOrderBookAddress(orders[0].symbol)) {
    console.log({
      orderBook: orders[0].symbol,
      bakend: brokerData.OrderBookAddr,
      api: traderAPI.getOrderBookAddress(orders[0].symbol),
    });
  }

  const call = {
    chainId: chainId,
    to: traderAPI.getOrderBookAddress(orders[0].symbol) as Address,
    data: encodeFunctionData({
      abi: orderBookAbi,
      functionName: 'postOrders',
      args: [clientOrders as never[], signatures as `0x${string}`[]],
    }),
    value: 0n,
  };

  return sendTransaction(call, { sponsor: hasPaymaster(chainId) }).then(({ hash }) => {
    // success submitting order to the node - inform backend
    orderSubmitted(chainId, brokerData.orderIds).then().catch(console.error);

    const marketOrders = brokerData.orderIds
      .filter((_id, idx) => orders[idx].type === ORDER_TYPE_MARKET)
      .map((id) => (id.startsWith('0x') ? id : `0x${id}`) as `0x${string}`);

    if (marketOrders.length > 0) {
      waitForTransactionReceipt(wagmiConfig, { hash, confirmations: 2 }) // TODO: seems like a regular problem with base?
        .then(() => {
          console.log('self executing order(s)', marketOrders);
          executeOrders(sendTransaction, traderAPI, orders[0].symbol, marketOrders)
            .then((execTx) => {
              console.log(`self-execution: ${execTx.hash}`);
            })
            .catch((e) => {
              console.log('self execution failed:', e);
            });
        })
        .catch((e) => {
          console.log('could not verify order on-chain, self execution skipped', e);
        });
    }

    return { hash, orderIds: brokerData.orderIds };
  });
}

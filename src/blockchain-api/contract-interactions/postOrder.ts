import { LOB_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import type { Account, Transport, WalletClient } from 'viem';
import type { Chain } from 'wagmi';

import { OrderDigestI, AddressT } from 'types/types';

export function postOrder(
  walletClient: WalletClient<Transport, Chain, Account>,
  signatures: string[],
  data: OrderDigestI
): Promise<{ hash: AddressT }> {
  const orders = TraderInterface.chainOrders(data.SCOrders, data.orderIds).map(
    TraderInterface.fromClientOrderToTypeSafeOrder
  );
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.OrderBookAddr as AddressT,
      abi: LOB_ABI,
      functionName: 'postOrders',
      args: [orders, signatures],
      gas: BigInt(2_000_000),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}

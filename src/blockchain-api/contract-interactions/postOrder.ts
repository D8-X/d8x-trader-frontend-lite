import { LOB_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import type { Account, Address, Transport, WalletClient } from 'viem';
import type { Chain } from 'wagmi';
import { type OrderDigestI } from 'types/types';

export function postOrder(
  walletClient: WalletClient<Transport, Chain, Account>,
  signatures: string[],
  data: OrderDigestI
): Promise<{ hash: Address }> {
  const orders = TraderInterface.chainOrders(data.SCOrders, data.orderIds).map(
    TraderInterface.fromClientOrderToTypeSafeOrder
  );
  if (!walletClient.account?.address) {
    throw new Error('account not connected');
  }
  const request = {
    chain: walletClient.chain,
    address: data.OrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'postOrders',
    args: [orders, signatures],
    gas: BigInt(2_000_000),
    account: walletClient.account,
  };
  return walletClient.writeContract(request).then((tx) => ({ hash: tx }));
}

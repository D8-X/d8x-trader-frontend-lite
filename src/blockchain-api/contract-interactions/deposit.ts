import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import type { Account, Transport, WalletClient } from 'viem';
import type { Chain } from 'wagmi';

import type { CollateralChangeResponseI, AddressT } from 'types/types';

export function deposit(
  walletClient: WalletClient<Transport, Chain, Account>,
  data: CollateralChangeResponseI
): Promise<{ hash: AddressT }> {
  const account = walletClient.account?.address;
  if (account === undefined) {
    throw new Error('account is undefined');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.proxyAddr as AddressT,
      abi: PROXY_ABI,
      functionName: 'deposit',
      args: [data.perpId, +data.amountHex, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gas: BigInt(2_000_000),
      value: BigInt(data.priceUpdate.updateFee),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}

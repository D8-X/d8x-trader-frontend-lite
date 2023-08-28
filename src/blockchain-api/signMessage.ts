import type { Account, Transport } from 'viem';
import type { Chain, WalletClient } from 'wagmi';

import type { AddressT } from 'types/types';

export function signMessages(walletClient: WalletClient<Transport, Chain, Account>, digests: string[]) {
  const promises = [];
  for (const digest of digests) {
    promises.push(walletClient.signMessage({ message: { raw: digest as AddressT } }));
  }
  return Promise.all(promises);
}

import type { Account, Address, Chain, Transport, WalletClient } from 'viem';

export function signMessages(walletClient: WalletClient<Transport, Chain, Account>, digests: string[]) {
  const promises = [];
  for (const digest of digests) {
    promises.push(walletClient.signMessage({ message: { raw: digest as Address } }));
  }
  return Promise.all(promises);
}

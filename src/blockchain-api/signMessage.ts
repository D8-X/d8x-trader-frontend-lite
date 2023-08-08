// import { Buffer } from 'buffer';
import { AddressT } from 'types/types';
import { WalletClient } from 'wagmi';

export function signMessages(walletClient: WalletClient, digests: string[]) {
  const promises = [];
  for (const digest of digests) {
    promises.push(walletClient.signMessage({ message: { raw: digest as AddressT } }));
  }
  return Promise.all(promises);
}

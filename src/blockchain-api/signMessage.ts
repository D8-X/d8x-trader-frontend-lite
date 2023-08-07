import { Buffer } from 'buffer';
import { WalletClient } from 'wagmi';

export function signMessages(walletClient: WalletClient, digests: string[]) {
  const promises = [];
  for (const digest of digests) {
    const digestBuffer = Buffer.from(digest.slice(2), 'hex');
    promises.push(walletClient.signMessage(digestBuffer));
  }
  return Promise.all(promises);
}

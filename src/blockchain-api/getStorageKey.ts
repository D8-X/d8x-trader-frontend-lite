import { etc } from '@noble/secp256k1';
import { WalletClient, toHex, stringToBytes } from 'viem';

export function getStorageKey(walletClient: WalletClient) {
  const account = walletClient.account;
  if (account === undefined) {
    throw new Error('Account not connected');
  }
  return walletClient
    .signMessage({ message: 'Unlock Delegate', account: account })
    .then((sig) => toHex(etc.hashToPrivateKey(stringToBytes(sig))));
}

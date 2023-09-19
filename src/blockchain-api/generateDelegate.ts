import { etc } from '@noble/secp256k1';
import { WalletClient, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export function generateDelegate(walletClient: WalletClient) {
  const account = walletClient.account;
  if (account === undefined) {
    throw new Error('Account not connected');
  }
  return walletClient
    .signMessage({ message: 'Generate Delegate', account: account })
    .then((sig) => privateKeyToAccount(toHex(etc.hashToPrivateKey(sig))));
}

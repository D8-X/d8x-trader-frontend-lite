import { etc } from '@noble/secp256k1';
import { WalletClient, toHex } from 'viem';
import secureLocalStorage from 'react-secure-storage';

export async function generateDelegate(walletClient: WalletClient, storageKey: string) {
  const account = walletClient.account;
  if (account === undefined) {
    throw new Error('Account not connected');
  }
  const pk = await walletClient
    .signMessage({ message: 'Generate Delegate', account: account })
    .then((sig) => toHex(etc.hashToPrivateKey(sig)));
  const encrypted = CryptoJS.AES.encrypt(pk, storageKey);
  secureLocalStorage.setItem(`delegateKey-${account}`, encrypted);
}

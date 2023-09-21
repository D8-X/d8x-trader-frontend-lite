import { etc } from '@noble/secp256k1';
import { WalletClient, bytesToHex, stringToBytes } from 'viem';
import secureLocalStorage from 'react-secure-storage';
import CryptoJS from 'crypto-js';

export async function generateDelegate(walletClient: WalletClient, storageKey: string) {
  const account = walletClient.account;
  if (account === undefined) {
    throw new Error('Account not connected');
  }
  const pk = await walletClient
    .signMessage({ message: 'Generate Delegate', account: account })
    .then((sig) => bytesToHex(etc.hashToPrivateKey(stringToBytes(sig))));
  const encrypted = CryptoJS.AES.encrypt(pk, storageKey).toString();
  secureLocalStorage.setItem(`delegateKey-${account}`, encrypted);
}

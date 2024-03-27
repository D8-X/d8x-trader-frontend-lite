import { etc } from '@noble/secp256k1';
import { WalletClient, bytesToHex, stringToBytes } from 'viem';
import secureLocalStorage from 'react-secure-storage';
import CryptoJS from 'crypto-js';
import { privateKeyToAccount } from 'viem/accounts';

export async function generateDelegate(walletClient: WalletClient, storageKey: string) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const pk = await walletClient
    .signMessage({ message: 'Generate Delegate', account: walletClient.account })
    .then((sig) => bytesToHex(etc.hashToPrivateKey(stringToBytes(sig))));
  const encrypted = CryptoJS.AES.encrypt(pk, storageKey).toString();
  secureLocalStorage.setItem(`delegateKey-${walletClient.account.address}`, encrypted);
  return privateKeyToAccount(pk);
}

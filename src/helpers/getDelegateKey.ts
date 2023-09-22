import secureLocalStorage from 'react-secure-storage';
import CryptoJS from 'crypto-js';
import { WalletClient } from 'viem';

export function getDelegateKey(walletClient: WalletClient, storageKey: string) {
  const encoded = secureLocalStorage.getItem(`delegateKey-${walletClient.account}`);
  if (encoded === null) {
    return undefined;
  } else {
    const bytes = CryptoJS.AES.decrypt(encoded as string, storageKey);
    try {
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      throw new Error('Invalid storaget key');
    }
  }
}

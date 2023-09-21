import secureLocalStorage from 'react-secure-storage';
import CryptoJS from 'crypto-js';
import { WalletClient } from 'viem';

export function getDelegateKey(walletClient: WalletClient, storageKey: string) {
  console.log('getDelegateKey');
  const encoded = secureLocalStorage.getItem(`delegateKey-${walletClient.account}`);
  if (encoded === null) {
    console.log('null key');
    return undefined;
  } else {
    const bytes = CryptoJS.AES.decrypt(encoded as string, storageKey);
    try {
      console.log(bytes);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      throw new Error('Invalid storaget key');
    }
  }
}

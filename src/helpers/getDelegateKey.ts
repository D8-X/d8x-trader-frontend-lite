import secureLocalStorage from 'react-secure-storage';
import CryptoJS from 'crypto-js';
import { type WalletClient } from 'viem';

export function getDelegateKey(walletClient: WalletClient, storageKey: string) {
  const userAddress = walletClient.account?.address;
  if (!userAddress) {
    return undefined;
  }
  const encoded = secureLocalStorage.getItem(`delegateKey-${userAddress}`);
  if (encoded === null) {
    return undefined;
  } else {
    const bytes = CryptoJS.AES.decrypt(encoded as string, storageKey);
    try {
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      return undefined;
    }
  }
}

import secureLocalStorage from 'react-secure-storage';
import CryptoJS from 'crypto-js';

export function getDelegateKey(storageKey: string) {
  const encoded = secureLocalStorage.getItem('delegateKey');
  if (encoded === undefined) {
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

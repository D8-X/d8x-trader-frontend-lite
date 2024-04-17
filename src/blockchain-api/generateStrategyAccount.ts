import { etc } from '@noble/secp256k1';
import { type WalletClient, bytesToHex, stringToBytes } from 'viem';
import secureLocalStorage from 'react-secure-storage';
import { privateKeyToAccount } from 'viem/accounts';

export async function generateStrategyAccount(walletClient: WalletClient) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const pk = await walletClient
    .signMessage({ message: 'Generate Strategy Account', account: walletClient.account })
    .then((sig) => bytesToHex(etc.hashToPrivateKey(stringToBytes(sig))));
  const account = privateKeyToAccount(pk);
  secureLocalStorage.setItem(`d8x_strategyAddress-${walletClient.account.address}`, account.address);
  return account;
}

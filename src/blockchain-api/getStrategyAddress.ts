import type { Address, WalletClient } from 'viem';
import secureLocalStorage from 'react-secure-storage';
import { generateStrategyAccount } from './generateStrategyAccount';

export async function getStrategyAddress(walletClient: WalletClient) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  let hedgerAddress = secureLocalStorage.getItem(`hedgerAddress-${walletClient.account.address}`);
  if (!hedgerAddress) {
    hedgerAddress = await generateStrategyAccount(walletClient).then((account) => account.address);
  }
  return hedgerAddress as Address;
}

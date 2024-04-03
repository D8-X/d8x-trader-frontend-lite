import { WalletClient } from 'viem';
import secureLocalStorage from 'react-secure-storage';
import { generateHedger } from './generateHedger';

export async function getHedgerAddress(walletClient: WalletClient) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  let hedgerAddress = secureLocalStorage.getItem(`hedgerAddress-${walletClient.account.address}`);
  if (!hedgerAddress) {
    hedgerAddress = await generateHedger(walletClient);
  }
  return hedgerAddress;
}

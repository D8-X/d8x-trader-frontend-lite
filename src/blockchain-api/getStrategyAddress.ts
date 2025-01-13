import type { WalletClient } from 'viem';
import { STRATEGY_ADDRESSES_LS_KEY } from 'store/strategies.store';
import { StrategyAddressI } from 'types/types';

export async function getStrategyAddress(walletClient: WalletClient) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const strategyAddresses = JSON.parse(localStorage.getItem(STRATEGY_ADDRESSES_LS_KEY) || '[]') as StrategyAddressI[];
  const idx = strategyAddresses.findIndex(({ userAddress }) => userAddress === walletClient.account?.address);
  if (idx < 0) {
    throw new Error(`No strategy address found for account ${walletClient.account.address}`);
  }
  return strategyAddresses[idx].strategyAddress;
}

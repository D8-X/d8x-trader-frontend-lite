import { Web3Provider } from '@ethersproject/providers';
import { Config, getWalletClient } from '@wagmi/core';
import { useMemo } from 'react';
import { type WalletClient } from 'viem';
import { useWalletClient } from 'wagmi';

import { wagmiConfigForLifi } from 'blockchain-api/wagmi/wagmiClient';

export function walletClientToSigner(walletClient?: WalletClient | null) {
  if (walletClient) {
    const provider = new Web3Provider(walletClient.transport, 'any');
    return provider.getSigner();
  } else {
    throw Error('WalletClient not found');
  }
}

export async function walletClientToSignerAsync(chainId?: number) {
  const walletClient = await getWalletClient(wagmiConfigForLifi, { chainId });
  return walletClientToSigner(walletClient);
}

export function useEthersSigner({ config, chainId }: { config?: Config; chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ config, chainId });
  return useMemo(() => (walletClient ? walletClientToSigner(walletClient) : undefined), [walletClient]);
}

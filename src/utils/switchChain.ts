import { getAccount, switchChain as switchChainWagmi } from '@wagmi/core';
import { wagmiConfigForLifi } from 'blockchain-api/wagmi/wagmiClient';

import { walletClientToSignerAsync } from 'hooks/useEthersSigner';

export const switchChain = async (chainId: number) => {
  const { chainId: connectedChainId } = getAccount(wagmiConfigForLifi);

  if (connectedChainId !== chainId) {
    try {
      const chain = await switchChainWagmi(wagmiConfigForLifi, { chainId });
      console.debug(`${connectedChainId} => ${chain?.id}`);
      return await walletClientToSignerAsync(chain?.id);
    } catch {
      throw new Error("Couldn't switch chain.");
    }
  }
  return walletClientToSignerAsync(connectedChainId);
};

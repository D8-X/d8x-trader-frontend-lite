import { getNetwork, switchNetwork } from '@wagmi/core';

import { walletClientToSignerAsync } from 'hooks/useEthersSigner';

export const switchChain = async (chainId: number) => {
  const network = getNetwork();

  if (network.chain?.id !== chainId) {
    try {
      const chain = await switchNetwork({ chainId });
      console.debug(`${network.chain?.id} => ${chain?.id}`);
      return await walletClientToSignerAsync(chain?.id);
    } catch {
      throw new Error("Couldn't switch chain.");
    }
  }
  return walletClientToSignerAsync(network.chain?.id);
};

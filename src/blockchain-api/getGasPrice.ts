import { getGasPrice as getGasPriceWagmi } from '@wagmi/core';

import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';

export async function getGasPrice(chainId?: number) {
  const gasPrice = await getGasPriceWagmi(wagmiConfig, { chainId });
  return (gasPrice * (chainId === 80084 ? 200n : 125n)) / 100n;
}

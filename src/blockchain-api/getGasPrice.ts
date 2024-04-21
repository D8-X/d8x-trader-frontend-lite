import { getGasPrice as getGasPriceWagmi } from '@wagmi/core';

import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';

export async function getGasPrice(chainId?: number) {
  const gasPrice = await getGasPriceWagmi(wagmiConfig, { chainId });
  return (gasPrice * 150n) / 100n;
}

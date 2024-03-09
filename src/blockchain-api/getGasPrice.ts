import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { getGasPrice as getGasPriceWagmi } from '@wagmi/core';

export async function getGasPrice(chainId?: number) {
  if (chainId !== 195) {
    return undefined;
  }
  const gasPrice = await getGasPriceWagmi(wagmiConfig, { chainId });
  return (gasPrice * 150n) / 100n;
}

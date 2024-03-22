import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { getGasPrice as getGasPriceWagmi } from '@wagmi/core';

export async function getGasPrice(chainId?: number) {
  let gasPrice = await getGasPriceWagmi(wagmiConfig, { chainId });
  if (chainId === 195) {
    // X1 gas prices are often stale -> add buffer
    gasPrice = (gasPrice * 150n) / 100n;
  }
  return gasPrice;
}

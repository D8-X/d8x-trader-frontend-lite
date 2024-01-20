import { publicClient } from 'blockchain-api/wagmi/wagmiClient';

export async function getGasPrice(chainId?: number) {
  if (chainId !== 195) {
    return undefined;
  }
  const gasPrice = await publicClient({ chainId }).getGasPrice();
  return (gasPrice * 110n) / 100n;
}

import { createConfig } from '@privy-io/wagmi';
import { chains } from 'blockchain-api/chains';
import { Transport } from 'viem';
import { http } from 'wagmi';

const transports: Record<(typeof chains)[number]['id'], Transport> = {};

chains.map((chain) => (transports[chain.id] = http()));
console.log(transports);

const wagmiConfig = createConfig({
  chains,
  transports,
});

export { chains, wagmiConfig };

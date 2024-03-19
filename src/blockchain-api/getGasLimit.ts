import { MethodE } from 'types/enums';

const ARBITRUM = [421614, 42161]; // arbitrum sepolia & arbitrum one

export function getGasLimit({ chainId, method }: { chainId?: number; method: MethodE }) {
  if (ARBITRUM.includes(chainId ?? 0)) {
    return method === MethodE.Approve ? 1_200_000n : 915_000n; // specific to Arbitrum
  } else {
    return method === MethodE.Approve ? 50_000n : 21_000n; // known constants on EVM
  }
}

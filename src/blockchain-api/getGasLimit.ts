const ARBITRUM = [421614, 42161]; // arbitrum sepolia & arbitrum one

export function getGasLimit({ chainId, method }: { chainId?: number; method: 'approve' | 'transfer' }) {
  if (ARBITRUM.includes(chainId ?? 0)) {
    return method === 'approve' ? 1_200_000n : 915_000n; // specific to Arbitrum
  } else {
    return method === 'approve' ? 50_000n : 21_000n; // known constants on EVM
  }
}

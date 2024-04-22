import { MethodE } from 'types/enums';

type GasLimitSettingsT = {
  [key in MethodE]: bigint;
};

type GasLimitsT = {
  default: GasLimitSettingsT;
  [key: number]: GasLimitSettingsT;
};

// Arbitrum
const ARBITRUM_LIMITS: GasLimitSettingsT = {
  [MethodE.Approve]: 1_200_000n,
  [MethodE.Interact]: 5_000_000n,
  [MethodE.Transfer]: 915_000n,
};

// Define gas limits based on chainId and method
const gasLimits: GasLimitsT = {
  default: {
    [MethodE.Approve]: 100_000n,
    [MethodE.Interact]: 850_000n,
    [MethodE.Transfer]: 42_000n,
  },
  [421614]: ARBITRUM_LIMITS, // Arbitrum Sepolia
  [42161]: ARBITRUM_LIMITS, // Arbitrum One
};

export function getGasLimit({ chainId, method }: { chainId?: number; method: MethodE }) {
  if (chainId !== undefined && Object.prototype.hasOwnProperty.call(gasLimits, chainId)) {
    return gasLimits[chainId][method];
  } else {
    return gasLimits.default[method];
  }
}

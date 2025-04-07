import { estimateFeesPerGas as estimateFeesPerGasWagmi } from '@wagmi/core';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';

export async function getFeesPerGas(chainId?: number) {
  try {
    // Get the fee data using wagmi
    const feeData = await estimateFeesPerGasWagmi(wagmiConfig, { chainId });

    console.log('feeData', feeData);
    // Apply chain-specific multipliers (similar to your getGasPrice function)
    const multiplierMaxFeePerGas = chainId === 80094 ? 1000n : 125n;
    const multiplierMaxPriorityFeePerGas = chainId === 80094 ? 5000n : 125n;

    return {
      maxFeePerGas: (feeData.maxFeePerGas * multiplierMaxFeePerGas) / 100n,
      maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas * multiplierMaxPriorityFeePerGas) / 100n,
    };
  } catch (error) {
    console.error('Error estimating fees per gas:', error);
  }
}

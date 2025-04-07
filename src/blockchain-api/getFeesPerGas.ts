import { estimateFeesPerGas as estimateFeesPerGasWagmi } from '@wagmi/core';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';

export async function getFeesPerGas(chainId?: number) {
  // Apply chain-specific multipliers (similar to your getGasPrice function)
  const multiplierMaxFeePerGas = chainId === 80094 ? 1000_00n : 125n;
  const multiplierMaxPriorityFeePerGas = chainId === 80094 ? 100_00n : 125n;
  try {
    // Get the fee data using wagmi: eip1559
    const feeData = await estimateFeesPerGasWagmi(wagmiConfig, { chainId, type: 'eip1559' });
    console.log('feeData eip1559', feeData);
    return {
      gasPrice: undefined,
      maxFeePerGas: (feeData.maxFeePerGas * multiplierMaxFeePerGas) / 100n,
      maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas * multiplierMaxPriorityFeePerGas) / 100n,
    };
  } catch (error) {
    // Get the fee data using wagmi: legacy
    const feeData = await estimateFeesPerGasWagmi(wagmiConfig, { chainId, type: 'legacy' });
    console.log('feeData legacy', feeData);
    return {
      gasPrice: (feeData.gasPrice * multiplierMaxFeePerGas) / 100n,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    };
  }
}

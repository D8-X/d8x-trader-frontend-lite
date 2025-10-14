import { readContract } from '@wagmi/core';
import { pythAbi } from 'blockchain-api/abi/pyth';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { Address, Hex } from 'viem';

export async function getUpdateFee(pythContractAddress: Address, updateData: Hex[]): Promise<bigint> {
  return readContract(wagmiConfig, {
    address: pythContractAddress,
    abi: pythAbi,
    functionName: 'getUpdateFee',
    args: [updateData],
  });
}

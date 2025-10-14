import { encodeFunctionData, type Address } from 'viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { NORMAL_ADDRESS_TIMEOUT } from 'blockchain-api/constants';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { SWAP_ABI } from 'components/deposit-modal/elements/mock-swap/constants';
import type { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';

export async function mockSwap(chainId: number, sendTransaction: SendTransactionCallT, swapAddress: Address) {
  const call = {
    chainId: chainId,
    to: swapAddress,
    data: encodeFunctionData({
      abi: SWAP_ABI,
      functionName: 'swapToMockToken',
    }),
    value: 0n,
  };

  return sendTransaction(call, { sponsor: hasPaymaster(chainId) }).then(async ({ hash }) => {
    await waitForTransactionReceipt(wagmiConfig, {
      hash,
      timeout: NORMAL_ADDRESS_TIMEOUT,
    });
    return { hash };
  });
}

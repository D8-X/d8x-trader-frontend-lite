import type { Address, PublicClient } from 'viem';
import { flatTokenAbi } from './flatTokenAbi';

export async function getFlatTokenInfo(
  publicClient: PublicClient,
  proxyAddr: Address,
  tokenAddress: Address,
  traderAddress: Address
) {
  const flatToken = {
    address: tokenAddress,
    abi: flatTokenAbi,
  } as const;
  const [{ result: supportedTokens }, { result: traderRegisteredToken }, { result: controller }] =
    await publicClient.multicall({
      contracts: [
        {
          ...flatToken,
          functionName: 'getSupportedTokens',
        },
        { ...flatToken, functionName: 'registeredToken', args: [traderAddress] },
        { ...flatToken, functionName: 'controller' },
      ],
      allowFailure: true,
    });
  return {
    isFlatToken: controller === proxyAddr,
    supportedTokens: supportedTokens ?? [],
    userRegisteredToken: traderRegisteredToken,
    controller,
  };
}

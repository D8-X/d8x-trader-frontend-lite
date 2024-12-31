import { zeroAddress, type Address, type PublicClient } from 'viem';
import { flatTokenAbi } from './flatTokenAbi';

export async function fetchFlatTokenInfo(
  publicClient: PublicClient,
  proxyAddr: Address,
  tokenAddress: Address,
  traderAddress: Address
) {
  const flatToken = {
    address: tokenAddress,
    abi: flatTokenAbi,
  } as const;
  const [{ result: supportedTokens }, { result: registeredToken }, { result: controller }] =
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
    registeredToken:
      controller === proxyAddr && registeredToken !== undefined && registeredToken !== zeroAddress
        ? registeredToken
        : undefined,
    supportedTokens: supportedTokens === undefined ? [] : [...supportedTokens],
    controller,
  };
}

import { erc20Abi, zeroAddress, type Address, type PublicClient } from 'viem';
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
  const [{ result: supportedTokens }, { result: registeredToken }, { result: controller }, { result: symbol }] =
    await publicClient.multicall({
      contracts: [
        {
          ...flatToken,
          functionName: 'getSupportedTokens',
        },
        { ...flatToken, functionName: 'registeredToken', args: [traderAddress] },
        { ...flatToken, functionName: 'controller' },
        { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
      ],
      allowFailure: true,
    });
  const isFlatToken = controller === proxyAddr && !!supportedTokens?.length;
  const tokenSymbols: string[] = [];
  if (isFlatToken) {
    const resp = await publicClient.multicall({
      contracts: supportedTokens.map((addr) => ({
        address: addr,
        abi: erc20Abi,
        functionName: 'symbol',
      })),
      allowFailure: true,
    });
    resp.forEach(({ status, result }) => {
      if (status === 'success') {
        tokenSymbols.push(result as string);
      } else {
        tokenSymbols.push(''); // or some default?
      }
    });
  }
  return {
    isFlatToken,
    registeredToken:
      controller === proxyAddr && registeredToken !== undefined && registeredToken !== zeroAddress
        ? registeredToken
        : undefined,
    supportedTokens:
      tokenSymbols.length > 0 && supportedTokens !== undefined
        ? supportedTokens.reduce((acc, curr, idx) => {
            acc[idx] = { ...acc[idx], symbol: tokenSymbols[idx], address: curr };
            return acc;
          }, new Array<{ symbol: string; address: Address }>(tokenSymbols.length))
        : [],
    supportedSymbols: tokenSymbols,
    controller,
    symbol: symbol ?? '',
  };
}

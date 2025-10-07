import { decNToFloat } from '@d8x/perpetuals-sdk';
import { erc20Abi, zeroAddress, type Address, type PublicClient } from 'viem';
import { flatTokenAbi } from '../abi/flatTokenAbi';

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
  let userConversion: number | undefined;
  let userSymbol: string | undefined;
  if (isFlatToken) {
    const resp = await publicClient.multicall({
      contracts: [
        ...supportedTokens.map((addr) => ({
          address: addr,
          abi: erc20Abi,
          functionName: 'symbol',
        })),
        {
          address: registeredToken ?? zeroAddress, // fails if not registered
          abi: erc20Abi,
          functionName: 'symbol',
        },
        {
          address: registeredToken ?? zeroAddress, // fails if not registered
          abi: erc20Abi,
          functionName: 'decimals',
        },
        {
          address: registeredToken ?? zeroAddress, // fails if not registered
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [traderAddress],
        },
        {
          address: tokenAddress,
          abi: flatTokenAbi,
          functionName: 'effectiveBalanceOf',
          args: [traderAddress],
        },
      ],
      allowFailure: true,
    });
    resp.slice(0, -4).forEach(({ status, result }) => {
      if (status === 'success') {
        tokenSymbols.push(result as string);
      } else {
        tokenSymbols.push(''); // or some default?
      }
    });
    const [registeredSymbol, registeredDecimals, registeredBalance, effectiveBalance] = resp.slice(-4);
    if (registeredBalance.status === 'success' && effectiveBalance.status === 'success') {
      userConversion =
        BigInt(effectiveBalance.result) > 0n
          ? decNToFloat(registeredBalance.result, Number(registeredDecimals.result)) /
            decNToFloat(effectiveBalance.result, 6)
          : 1;
      userSymbol = registeredSymbol.result as string;
    }
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
    compositePrice: userConversion,
    registeredSymbol: userSymbol,
  };
}

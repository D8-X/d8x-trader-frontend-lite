import { memo, useEffect, useMemo } from 'react';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useConnect, useReadContracts } from 'wagmi';

import { REFETCH_BALANCES_INTERVAL } from 'appConstants';
import { flatTokenAbi } from 'blockchain-api/abi/flatTokenAbi';
import { AssetLine } from 'components/asset-line/AssetLine';
import { useAtomValue } from 'jotai';
import { smartAccountClientAtom } from 'store/app.store';
import { flatTokenAtom } from 'store/pools.store';
import { PoolWithIdI } from 'types/types';
import { valueToFractionDigits } from 'utils/formatToCurrency';

interface PoolLinePropsI {
  pool: PoolWithIdI;
  showEmpty?: boolean;
}

export const PoolLine = memo(({ pool, showEmpty = true }: PoolLinePropsI) => {
  const { address, isConnected } = useAccount();
  const { isPending } = useConnect();
  const flatToken = useAtomValue(flatTokenAtom);
  const smartAccountClient = useAtomValue(smartAccountClientAtom);

  const balanceAddress = useMemo(() => {
    return smartAccountClient?.account?.address || address;
  }, [address, smartAccountClient]);

  const { data: tokenBalanceData, refetch } = useReadContracts({
    allowFailure: true,
    contracts: [
      {
        address: pool.settleTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [balanceAddress as Address],
      },
      {
        address: pool.settleTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
      {
        address: pool.settleTokenAddr as Address,
        abi: flatTokenAbi,
        functionName: 'effectiveBalanceOf',
        args: [balanceAddress as Address],
      },
      {
        address: pool.settleTokenAddr as Address,
        abi: flatTokenAbi,
        functionName: 'getSupportedTokens',
      },
    ],
    query: {
      enabled: balanceAddress && pool.settleTokenAddr !== undefined && !isPending && isConnected,
    },
  });

  const { data: composableBalances } = useReadContracts({
    allowFailure: false, // should not run if this isn't a flat token
    contracts: flatToken?.supportedTokens?.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [balanceAddress as Address],
    })),
    query: {
      enabled: pool.poolId === flatToken?.poolId && balanceAddress && isConnected && !flatToken?.registeredSymbol,
    },
  });

  const { data: composableDecimals } = useReadContracts({
    allowFailure: false,
    contracts: flatToken?.supportedTokens?.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: 'decimals',
    })),
    query: {
      enabled: pool.poolId === flatToken?.poolId && balanceAddress && isConnected && !flatToken?.registeredSymbol,
    },
  });

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const intervalId = setInterval(() => {
      refetch().then();
    }, REFETCH_BALANCES_INTERVAL);
    return () => {
      clearInterval(intervalId);
    };
  }, [refetch, isConnected]);

  if (!showEmpty && tokenBalanceData?.[0]?.result === 0n) {
    return null;
  }

  const tokenBalance =
    tokenBalanceData?.[2].status === 'success' ? tokenBalanceData?.[2].result : tokenBalanceData?.[0].result;
  const unroundedSCValue =
    tokenBalanceData?.[1].status === 'success' && tokenBalance !== undefined
      ? +formatUnits(tokenBalance, tokenBalanceData[1].result)
      : 1;
  const numberDigits = valueToFractionDigits(unroundedSCValue);

  const [userPrice, userSymbol] =
    !!flatToken && pool.poolId === flatToken.poolId && flatToken.registeredSymbol
      ? [flatToken.compositePrice ?? 1, flatToken.registeredSymbol]
      : [1, pool.settleSymbol];

  return !!flatToken &&
    pool.poolId === flatToken.poolId &&
    !flatToken.registeredSymbol &&
    composableBalances &&
    composableDecimals ? (
    <>
      {flatToken.supportedTokens.map((token, idx) => (
        <AssetLine
          key={token.address}
          symbol={token.symbol}
          tokenAddress={token.address}
          value={(+formatUnits(BigInt(composableBalances[idx]), Number(composableDecimals[idx])) * userPrice).toFixed(
            numberDigits
          )}
        />
      ))}
    </>
  ) : (
    <AssetLine
      symbol={userSymbol}
      tokenAddress={pool.settleTokenAddr as `0x${string}`}
      value={
        tokenBalance !== undefined && tokenBalanceData?.[1].status === 'success'
          ? (+formatUnits(tokenBalance, tokenBalanceData[1].result) * userPrice).toFixed(numberDigits)
          : ''
      }
    />
  );
});

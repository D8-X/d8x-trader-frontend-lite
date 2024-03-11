import { memo, useEffect } from 'react';
import { useAccount, useConnect, useReadContracts } from 'wagmi';

import { AssetLine } from 'components/asset-line/AssetLine';
import { PoolWithIdI } from 'types/types';

import { REFETCH_BALANCES_INTERVAL } from '../../constants';
import { Address } from 'viem/accounts';
import { erc20Abi, formatUnits } from 'viem';

interface PoolLinePropsI {
  pool: PoolWithIdI;
  showEmpty?: boolean;
}

export const PoolLine = memo(({ pool, showEmpty = true }: PoolLinePropsI) => {
  const { address, isConnected } = useAccount();
  const { isPending } = useConnect();

  const { data: tokenBalanceData, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: pool.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: pool.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: { enabled: address && pool.marginTokenAddr !== undefined && !isPending && isConnected },
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

  if (!showEmpty && tokenBalanceData?.[0] === 0n) {
    return null;
  }

  return (
    <AssetLine
      symbol={pool.poolSymbol}
      value={tokenBalanceData ? +formatUnits(tokenBalanceData[0], tokenBalanceData[1]) : ''}
    />
  );
});

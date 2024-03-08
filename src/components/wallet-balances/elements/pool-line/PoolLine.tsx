import { memo, useEffect } from 'react';
import { type Address, useAccount, useBalance, useConnect } from 'wagmi';

import { AssetLine } from 'components/asset-line/AssetLine';
import { PoolWithIdI } from 'types/types';

import { REFETCH_BALANCES_INTERVAL } from '../../constants';

interface PoolLinePropsI {
  pool: PoolWithIdI;
  showEmpty?: boolean;
}

export const PoolLine = memo(({ pool, showEmpty = true }: PoolLinePropsI) => {
  const { address, isConnected } = useAccount();
  const { isLoading } = useConnect();

  const { data: tokenBalanceData, refetch } = useBalance({
    address,
    token: pool.marginTokenAddr as Address,
    enabled: address && pool.marginTokenAddr !== undefined && !isLoading && isConnected,
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

  if (!showEmpty && tokenBalanceData?.value === 0n) {
    return null;
  }

  return <AssetLine symbol={pool.poolSymbol} value={tokenBalanceData ? +tokenBalanceData?.formatted : ''} />;
});

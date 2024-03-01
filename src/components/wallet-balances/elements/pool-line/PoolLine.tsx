import { memo, useEffect } from 'react';
import { type Address, useAccount, useBalance } from 'wagmi';

import { AssetLine } from 'components/asset-line/AssetLine';
import { PoolWithIdI } from 'types/types';
import { formatCurrency } from 'utils/formatCurrency';

import { REFETCH_BALANCES_INTERVAL } from '../../constants';

interface PoolLinePropsI {
  pool: PoolWithIdI;
}

export const PoolLine = memo(({ pool }: PoolLinePropsI) => {
  const { address, isConnected } = useAccount();

  const { data: tokenBalanceData, refetch } = useBalance({
    address,
    token: pool.marginTokenAddr as Address,
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

  return (
    <AssetLine symbol={pool.poolSymbol} value={tokenBalanceData ? formatCurrency(+tokenBalanceData?.formatted) : ''} />
  );
});

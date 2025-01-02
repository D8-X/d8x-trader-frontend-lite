import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { formatUnits } from 'viem/utils';
import { useAccount } from 'wagmi';

import { REFETCH_BALANCES_INTERVAL } from 'appConstants';
import { AssetLine } from 'components/asset-line/AssetLine';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { poolsAtom } from 'store/pools.store';

import { PoolLine } from './elements/pool-line/PoolLine';

import styles from './WalletBalances.module.scss';
import { valueToFractionDigits } from 'utils/formatToCurrency';

export const WalletBalances = () => {
  const pools = useAtomValue(poolsAtom);

  const { isConnected } = useAccount();

  const { gasTokenBalance, refetchWallet } = useUserWallet();

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const intervalId = setInterval(() => {
      refetchWallet();
    }, REFETCH_BALANCES_INTERVAL);
    return () => {
      clearInterval(intervalId);
    };
  }, [refetchWallet, isConnected]);

  const activePools = useMemo(() => pools.filter((pool) => pool.isRunning), [pools]);
  const inactivePools = useMemo(() => pools.filter((pool) => !pool.isRunning), [pools]);
  const unroundedGasValue = gasTokenBalance ? +formatUnits(gasTokenBalance.value, gasTokenBalance.decimals) : 1;
  const numberDigits = valueToFractionDigits(unroundedGasValue);

  return (
    <div className={styles.root}>
      <AssetLine
        key={gasTokenBalance?.symbol || 'gas-token'}
        symbol={gasTokenBalance?.symbol || ''}
        value={
          gasTokenBalance ? (+formatUnits(gasTokenBalance.value, gasTokenBalance.decimals)).toFixed(numberDigits) : ''
        }
      />
      {activePools.map((pool) => (
        <PoolLine key={pool.poolSymbol + pool.marginTokenAddr} pool={pool} />
      ))}
      {inactivePools.map((pool) => (
        <PoolLine key={pool.poolSymbol + pool.marginTokenAddr} pool={pool} showEmpty={false} />
      ))}
    </div>
  );
};

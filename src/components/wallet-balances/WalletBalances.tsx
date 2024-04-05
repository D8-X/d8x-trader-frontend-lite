import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { formatUnits } from 'viem/utils';
import { useAccount, useBalance } from 'wagmi';

import { REFETCH_BALANCES_INTERVAL } from 'appConstants';
import { AssetLine } from 'components/asset-line/AssetLine';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { depositModalAddressAtom } from 'store/app.store';
import { poolsAtom } from 'store/pools.store';

import { PoolLine } from './elements/pool-line/PoolLine';

import styles from './WalletBalances.module.scss';

export const WalletBalances = () => {
  const pools = useAtomValue(poolsAtom);
  const depositModalAddress = useAtomValue(depositModalAddressAtom);

  const { isConnected } = useAccount();

  const { refetchWallet } = useUserWallet();

  const { data: gasTokenBalance } = useBalance({ address: depositModalAddress || undefined });

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

  return (
    <div className={styles.root}>
      <AssetLine
        key={gasTokenBalance?.symbol || 'gas-token'}
        symbol={gasTokenBalance?.symbol || ''}
        value={gasTokenBalance ? formatUnits(gasTokenBalance.value, gasTokenBalance.decimals) : ''}
      />
      {activePools.map((pool) => (
        <PoolLine key={pool.poolSymbol} pool={pool} />
      ))}
      {inactivePools.map((pool) => (
        <PoolLine key={pool.poolSymbol} pool={pool} showEmpty={false} />
      ))}
    </div>
  );
};

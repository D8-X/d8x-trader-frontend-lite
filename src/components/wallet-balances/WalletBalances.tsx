import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';

import { AssetLine } from 'components/asset-line/AssetLine';
import { gasTokenSymbolAtom, poolsAtom } from 'store/pools.store';
import { formatCurrency } from 'utils/formatCurrency';

import { REFETCH_BALANCES_INTERVAL } from './constants';
import { PoolLine } from './elements/pool-line/PoolLine';

import styles from './WalletBalances.module.scss';
import { Typography } from '@mui/material';
import { Translate } from '../translate/Translate';

export const WalletBalances = () => {
  const pools = useAtomValue(poolsAtom);
  const gasTokenSymbol = useAtomValue(gasTokenSymbolAtom);

  const { address, isConnected } = useAccount();

  const { data: gasTokenBalanceData, refetch } = useBalance({
    address,
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

  const activePools = useMemo(() => pools.filter((pool) => pool.isRunning), [pools]);

  return (
    <div className={styles.root}>
      <AssetLine
        key={gasTokenSymbol || 'gas-token'}
        symbol={gasTokenSymbol || ''}
        value={gasTokenBalanceData ? formatCurrency(+gasTokenBalanceData.formatted) : ''}
      />
      {activePools.map((pool) => (
        <PoolLine key={pool.poolSymbol} pool={pool} />
      ))}
      <Typography variant="bodyTiny" className={styles.noteText}>
        <Translate i18nKey="common.deposit-modal.deposit-note" values={{ currencyName: gasTokenSymbol }} />{' '}
      </Typography>
    </div>
  );
};

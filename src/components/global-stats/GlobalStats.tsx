import { useAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChainId } from 'wagmi';

import { Box, Typography } from '@mui/material';

import { PERIOD_OF_7_DAYS } from 'app-constants';
import { getWeeklyAPI } from 'network/history';
import { formatToCurrency } from 'utils/formatToCurrency';
import {
  dCurrencyPriceAtom,
  tvlAtom,
  selectedLiquidityPoolAtom,
  loadStatsAtom,
  sdkConnectedAtom,
} from 'store/vault-pools.store';
import { traderAPIAtom } from 'store/pools.store';

import styles from './GlobalStats.module.scss';

export const GlobalStats = () => {
  const chainId = useChainId();

  const [selectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [dCurrencyPrice, setDCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [tvl, setTvl] = useAtom(tvlAtom);
  const [loadStats] = useAtom(loadStatsAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);

  const [weeklyAPI, setWeeklyAPI] = useState<number>();

  const weeklyApiRequestSentRef = useRef(false);

  useEffect(() => {
    if (!loadStats) {
      return;
    }

    if (!chainId || !selectedLiquidityPool) {
      setWeeklyAPI(undefined);
      return;
    }

    if (weeklyApiRequestSentRef.current) {
      return;
    }

    const fromTimestamp = Math.floor((Date.now() - PERIOD_OF_7_DAYS) / 1000);
    const toTimestamp = Math.floor(Date.now() / 1000);

    weeklyApiRequestSentRef.current = true;
    getWeeklyAPI(chainId, fromTimestamp, toTimestamp, selectedLiquidityPool.poolSymbol)
      .then((data) => {
        setWeeklyAPI(data.apy * 100);
      })
      .finally(() => {
        weeklyApiRequestSentRef.current = false;
      });
  }, [chainId, selectedLiquidityPool, loadStats]);

  useEffect(() => {
    if (!loadStats) {
      return;
    }
    setDCurrencyPrice(null);
    if (traderAPI && isSDKConnected && selectedLiquidityPool) {
      traderAPI.getShareTokenPrice(selectedLiquidityPool.poolSymbol).then((price) => setDCurrencyPrice(price));
    }
  }, [traderAPI, selectedLiquidityPool, loadStats, isSDKConnected, setDCurrencyPrice]);

  useEffect(() => {
    if (!loadStats) {
      return;
    }
    setTvl(null);
    if (traderAPI && isSDKConnected && selectedLiquidityPool) {
      traderAPI
        .getPoolState(selectedLiquidityPool.poolSymbol)
        .then((PoolState) => setTvl(PoolState.pnlParticipantCashCC));
    }
  }, [traderAPI, selectedLiquidityPool, loadStats, isSDKConnected, setTvl]);

  const dSupply = useMemo(() => {
    if (selectedLiquidityPool && dCurrencyPrice && tvl) {
      return formatToCurrency(tvl / dCurrencyPrice, `d${selectedLiquidityPool?.poolSymbol}`);
    }
    return '--';
  }, [selectedLiquidityPool, dCurrencyPrice, tvl]);

  return (
    <Box className={styles.root}>
      <Box key="midPrice" className={styles.statContainer}>
        <Typography variant="bodyTiny" className={styles.statLabel}>
          Weekly APY
        </Typography>
        <Typography variant="bodyLarge" className={styles.statValue}>
          {weeklyAPI !== undefined ? formatToCurrency(weeklyAPI, '%') : '--'}
        </Typography>
      </Box>
      <Box key="markPrice" className={styles.statContainer}>
        <Typography variant="bodyTiny" className={styles.statLabel}>
          TVL
        </Typography>
        <Typography variant="bodyLarge" className={styles.statValue}>
          {selectedLiquidityPool && tvl != null ? formatToCurrency(tvl, selectedLiquidityPool.poolSymbol) : '--'}
        </Typography>
      </Box>
      <Box key="indexPrice" className={styles.statContainer}>
        <Typography variant="bodyTiny" className={styles.statLabel}>
          d{selectedLiquidityPool?.poolSymbol} Price
        </Typography>
        <Typography variant="bodyLarge" className={styles.statValue}>
          {dCurrencyPrice != null ? formatToCurrency(dCurrencyPrice, selectedLiquidityPool?.poolSymbol) : '--'}
        </Typography>
      </Box>
      <Box key="fundingRate" className={styles.statContainer}>
        <Typography variant="bodyTiny" className={styles.statLabel}>
          d{selectedLiquidityPool?.poolSymbol} Supply
        </Typography>
        <Typography variant="bodyLarge" className={styles.statValue}>
          {dSupply}
        </Typography>
      </Box>
    </Box>
  );
};

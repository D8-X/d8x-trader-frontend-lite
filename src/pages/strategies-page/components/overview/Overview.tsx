import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { getEtherFiAPY } from 'network/network';
import { strategyPerpetualStatsAtom, strategyPositionAtom } from 'store/strategies.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import EigenLayerLogo from '../assets/eigenLayerLogo.svg?react';
import EtherFiLogo from '../assets/etherFiLogo.svg?react';
import WeETHLogo from '../assets/weethLogo.svg?react';
import D8XLogo from '../assets/d8xLogo.svg?react';

import styles from './Overview.module.scss';

export const Overview = () => {
  const { t } = useTranslation();

  const strategyPosition = useAtomValue(strategyPositionAtom);
  const strategyPerpetualStats = useAtomValue(strategyPerpetualStatsAtom);

  const [apy, setApy] = useState<string>();

  const isDataRequestSent = useRef(false);

  const syntheticPositionUSD = useMemo(() => {
    if (strategyPosition) {
      return strategyPosition.positionNotionalBaseCCY * strategyPosition.entryPrice;
    }
  }, [strategyPosition]);

  const fetchData = useCallback(() => {
    if (isDataRequestSent.current) {
      return;
    }

    isDataRequestSent.current = true;

    getEtherFiAPY()
      .then(({ etherfiApy }) => {
        setApy(etherfiApy);
      })
      .finally(() => {
        isDataRequestSent.current = false;
      });
  }, []);

  useEffect(() => {
    fetchData();

    return () => {
      isDataRequestSent.current = false;
    };
  }, [fetchData]);

  return (
    <div className={styles.root}>
      <Typography variant="h4" className={styles.title}>
        {t('pages.strategies.overview.title')}
      </Typography>
      <div className={styles.dataBlock}>
        <div key="synthetic-position" className={styles.dataItem}>
          <Typography variant="bodyTiny" component="p" className={styles.dataTitle}>
            {t('pages.strategies.overview.synthetic-position')}
          </Typography>
          <Typography variant="bodyMedium" className={styles.dataValue}>
            {syntheticPositionUSD ? formatToCurrency(syntheticPositionUSD, 'USD') : '-'}
          </Typography>
        </div>
        <div key="your-yield" className={styles.dataItem}>
          <Typography variant="bodyTiny" component="p" className={styles.dataTitle}>
            {t('pages.strategies.overview.your-yield')}
          </Typography>
          <Typography variant="bodyMedium" className={styles.dataValue}>
            <span className={`${styles.itemLogoHolder} ${styles.rounded}`}>{<WeETHLogo />}</span>
            <span>{t('pages.strategies.overview.eth-apr')}</span>
            {strategyPosition && strategyPerpetualStats && syntheticPositionUSD && apy ? (
              <>
                {formatToCurrency(
                  (strategyPosition?.collateralCC * Number(apy) * strategyPerpetualStats.indexPrice) /
                    syntheticPositionUSD,
                  '%',
                  false,
                  2
                )}
              </>
            ) : (
              '-'
            )}
          </Typography>
          <Typography variant="bodyMedium" className={styles.dataValue}>
            <span className={`${styles.itemLogoHolder} ${styles.rounded}`}>{<D8XLogo />}</span>
            <span>{t('pages.strategies.overview.d8x-apr')}</span>
            {strategyPerpetualStats && syntheticPositionUSD ? (
              <>{formatToCurrency((strategyPerpetualStats.currentFundingRateBps / 100 / 8) * 365 * 24, '%')}</>
            ) : (
              '-'
            )}
          </Typography>
          <Typography variant="bodyMedium" className={styles.dataValue}>
            <>
              <span className={`${styles.itemLogoHolder} ${styles.rounded}`}>{<EigenLayerLogo />}</span>
              <span>{t('pages.strategies.overview.your-points')}</span>
            </>
          </Typography>
          <Typography variant="bodyMedium" className={styles.dataValue}>
            <>
              <span className={`${styles.itemLogoHolder} ${styles.rounded}`}>{<EtherFiLogo />}</span>
              <span>{t('pages.strategies.overview.your-points-2')}</span>
            </>
          </Typography>
          <Typography variant="bodyMedium" className={styles.dataValue}>
            <>
              <span className={`${styles.itemLogoHolder} ${styles.rounded}`}>{<D8XLogo />}</span>
              <span>{t('pages.strategies.overview.your-points-3')}</span>
            </>
          </Typography>
        </div>
      </div>
    </div>
  );
};

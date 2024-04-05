import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import styles from './Overview.module.scss';
import { useAtomValue } from 'jotai';
import { strategyPositionAtom } from 'store/strategies.store';
import { useMemo } from 'react';
import { formatToCurrency } from 'utils/formatToCurrency';

export const Overview = () => {
  const { t } = useTranslation();

  const strategyPosition = useAtomValue(strategyPositionAtom);

  const syntethicPositionUSD = useMemo(() => {
    if (strategyPosition) {
      return strategyPosition.positionNotionalBaseCCY * strategyPosition.entryPrice;
    }
  }, [strategyPosition]);

  const pnlUSD = useMemo(() => {
    if (strategyPosition) {
      console.log(strategyPosition);
      return (
        strategyPosition.positionNotionalBaseCCY * strategyPosition.entryPrice +
        strategyPosition.unrealizedFundingCollateralCCY * strategyPosition.collToQuoteConversion -
        strategyPosition.positionNotionalBaseCCY * strategyPosition.markPrice
      );
    }
  }, [strategyPosition]);

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
            {syntethicPositionUSD ? formatToCurrency(syntethicPositionUSD, 'USD') : '-'}
          </Typography>
        </div>
        <div key="your-yield" className={styles.dataItem}>
          <Typography variant="bodyTiny" component="p" className={styles.dataTitle}>
            {t('pages.strategies.overview.your-yield')}
          </Typography>
          <Typography variant="bodyMedium" className={styles.dataValue}>
            {pnlUSD && syntethicPositionUSD ? formatToCurrency((100 * pnlUSD) / syntethicPositionUSD, '%') : '-'}
          </Typography>
        </div>
      </div>
    </div>
  );
};

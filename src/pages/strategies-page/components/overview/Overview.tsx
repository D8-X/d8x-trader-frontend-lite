import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { strategyPerpetualAtom, strategyPositionAtom } from 'store/strategies.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './Overview.module.scss';

export const Overview = () => {
  const { t } = useTranslation();

  const strategyPosition = useAtomValue(strategyPositionAtom);
  const strategyPerpetual = useAtomValue(strategyPerpetualAtom);

  const syntheticPositionUSD = useMemo(() => {
    if (strategyPosition) {
      return strategyPosition.positionNotionalBaseCCY * strategyPosition.entryPrice;
    }
  }, [strategyPosition]);

  const pnlUSD = useMemo(() => {
    if (strategyPosition && strategyPerpetual) {
      console.log(
        'strategyPosition.collateralCC * strategyPosition.collToQuoteConversion',
        strategyPosition.collateralCC * strategyPosition.collToQuoteConversion
      );
      console.log(
        'strategyPosition.positionNotionalBaseCCY * strategyPosition.markPrice',
        strategyPosition.positionNotionalBaseCCY * strategyPosition.markPrice
      );
      console.log(
        'strategyPosition.unrealizedFundingCollateralCCY * strategyPosition.collToQuoteConversion',
        strategyPosition.unrealizedFundingCollateralCCY * strategyPosition.collToQuoteConversion
      );
      console.log('strategyPosition.collToQuoteConversion', strategyPosition.collToQuoteConversion);
      console.log('strategyPosition.markPrice', strategyPosition.markPrice);
      console.log('strategyPosition.collateralCC', strategyPosition.collateralCC);
      console.log('strategyPosition.positionNotionalBaseCCY', strategyPosition.positionNotionalBaseCCY);

      return (
        (strategyPosition.collateralCC * strategyPosition.collToQuoteConversion) / strategyPerpetual?.indexPrice -
        strategyPosition.positionNotionalBaseCCY * strategyPosition.markPrice +
        strategyPosition.unrealizedFundingCollateralCCY * strategyPosition.collToQuoteConversion
      );
    }
  }, [strategyPosition, strategyPerpetual]);

  console.log('pnl', pnlUSD);

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
            {pnlUSD && syntheticPositionUSD ? (
              <>
                {formatToCurrency(100 * (pnlUSD / syntheticPositionUSD), '%')}
                <span>{t('pages.strategies.overview.your-points')}</span>
              </>
            ) : (
              '-'
            )}
          </Typography>
        </div>
      </div>
    </div>
  );
};

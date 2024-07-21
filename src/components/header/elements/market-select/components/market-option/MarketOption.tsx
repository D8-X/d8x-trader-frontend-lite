import classnames from 'classnames';
import { Suspense, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MenuItem, Typography } from '@mui/material';

import { AssetTypeE } from 'types/enums';
import { TemporaryAnyT } from 'types/types';
import { getDynamicLogo } from 'utils/getDynamicLogo';

import type { SelectItemI } from '../../../header-select/types';
import type { PerpetualWithPoolAndMarketI } from '../../types';

import styles from './MarketOption.module.scss';

interface MarketOptionPropsI {
  isSelected: boolean;
  option: SelectItemI<PerpetualWithPoolAndMarketI>;
  onClick: () => void;
}

export const MarketOption = memo(({ option, isSelected, onClick }: MarketOptionPropsI) => {
  const { t } = useTranslation();

  const IconComponent = useMemo(
    () => getDynamicLogo(option.item.baseCurrency.toLowerCase()) as TemporaryAnyT,
    [option.item.baseCurrency]
  );

  const marketData = option.item.marketData;

  return (
    <MenuItem
      value={option.value}
      selected={isSelected}
      className={classnames({ [styles.selectedOption]: isSelected })}
      onClick={onClick}
    >
      <div className={styles.optionHolder}>
        <div className={styles.optionLeftBlock}>
          <div className={styles.iconHolder}>
            <Suspense fallback={null}>
              <IconComponent width={24} height={24} />
            </Suspense>
          </div>
          <Typography variant="bodySmall" className={styles.label}>
            {option.item.baseCurrency}/{option.item.quoteCurrency}
            <Typography variant="bodyTiny" component="div">
              {option.item.settleSymbol}
            </Typography>
          </Typography>
        </div>
        <div className={styles.optionRightBlock}>
          {marketData && marketData.isOpen ? (
            <>
              <Typography variant="bodySmall" className={styles.value}>
                {marketData.currentPx.toFixed(2)}
              </Typography>
              {marketData.assetType !== AssetTypeE.Prediction && (
                <Typography
                  variant="bodyTiny"
                  className={classnames(styles.priceChange, {
                    [styles.buyPrice]: marketData.ret24hPerc > 0,
                    [styles.sellPrice]: marketData.ret24hPerc < 0,
                  })}
                >
                  {marketData.ret24hPerc.toFixed(2)}%
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="bodySmall" className={styles.status}>
              {marketData ? t('common.select.market.closed') : ''}
            </Typography>
          )}
        </div>
      </div>
    </MenuItem>
  );
});

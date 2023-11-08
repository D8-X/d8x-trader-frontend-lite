import classnames from 'classnames';
import { Suspense, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MenuItem, Typography } from '@mui/material';

import { getDynamicLogo } from 'utils/tokens';

import type { SelectItemI } from '../../../header-select/types';
import { PerpetualWithPoolAndMarketI } from '../../types';

import styles from './MarketOption.module.scss';

interface MarketOptionPropsI {
  isSelected: boolean;
  option: SelectItemI<PerpetualWithPoolAndMarketI>;
  onClick: () => void;
}

export const MarketOption = memo(({ option, isSelected, onClick }: MarketOptionPropsI) => {
  const IconComponent = useMemo(
    () => getDynamicLogo(option.item.baseCurrency.toLowerCase()),
    [option.item.baseCurrency]
  );
  const { t } = useTranslation();

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
              {option.item.poolSymbol}
            </Typography>
          </Typography>
        </div>
        <div className={styles.optionRightBlock}>
          {option.item.marketData && option.item.marketData.isOpen ? (
            <>
              <Typography variant="bodySmall" className={styles.value}>
                {option.item.marketData.currentPx.toFixed(2)}
              </Typography>
              <Typography
                variant="bodyTiny"
                className={classnames(styles.priceChange, {
                  [styles.buyPrice]: option.item.marketData.ret24hPerc > 0,
                  [styles.sellPrice]: option.item.marketData.ret24hPerc < 0,
                })}
              >
                {option.item.marketData.ret24hPerc.toFixed(2)}%
              </Typography>
            </>
          ) : (
            <Typography variant="bodySmall" className={styles.status}>
              {option.item.marketData ? t('common.select.market.closed') : ''}
            </Typography>
          )}
        </div>
      </div>
    </MenuItem>
  );
});

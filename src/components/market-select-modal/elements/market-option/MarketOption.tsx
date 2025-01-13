import classnames from 'classnames';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { MenuItem, Typography } from '@mui/material';

import { CurrencyBadge } from 'components/currency-badge/CurrencyBadge';
import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import type { SelectItemI } from 'components/header/elements/header-select/types';
import type { PerpetualWithPoolAndMarketI } from 'components/market-select-modal/types';
import { AssetTypeE } from 'types/enums';

import styles from './MarketOption.module.scss';

interface MarketOptionPropsI {
  isSelected: boolean;
  option: SelectItemI<PerpetualWithPoolAndMarketI>;
  onClick: () => void;
}

export const MarketOption = memo(({ option, isSelected, onClick }: MarketOptionPropsI) => {
  const { t } = useTranslation();

  const marketData = option.item.marketData;

  return (
    <MenuItem
      value={option.value}
      selected={isSelected}
      className={classnames(styles.root, { [styles.selected]: isSelected })}
      onClick={onClick}
    >
      <div className={styles.optionHolder}>
        <div className={styles.optionLeftBlock}>
          <div
            className={classnames(styles.iconsHolder, {
              [styles.prediction]: marketData?.assetType === AssetTypeE.Prediction,
            })}
          >
            <div className={styles.baseIcon}>
              <DynamicLogo logoName={option.item.baseCurrency.toLowerCase()} width={24} height={24} />
            </div>
            {marketData?.assetType !== AssetTypeE.Prediction && (
              <div className={styles.quoteIcon}>
                <DynamicLogo logoName={option.item.quoteCurrency.toLowerCase()} width={24} height={24} />
              </div>
            )}
          </div>
          <div className={styles.currencyData}>
            <Typography variant="bodySmall" className={styles.label}>
              {option.item.baseCurrency}/{option.item.quoteCurrency}/{option.item.settleSymbol}
            </Typography>
            <div>
              <CurrencyBadge
                assetType={marketData?.assetType}
                label={t(`common.select.market.${marketData?.assetType}`)}
              />
            </div>
          </div>
        </div>
        <div className={styles.optionRightBlock}>
          {marketData && marketData.isOpen ? (
            <div className={styles.priceData}>
              <Typography variant="bodySmall" className={styles.price}>
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
                  <span>{marketData.ret24hPerc.toFixed(2)}%</span>
                  <span className={styles.arrow}>
                    {marketData.ret24hPerc >= 0 ? <ArrowDropUp /> : <ArrowDropDown />}
                  </span>
                </Typography>
              )}
            </div>
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

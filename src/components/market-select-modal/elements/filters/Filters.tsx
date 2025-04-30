import classnames from 'classnames';
import { useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { AssetTypeE } from 'types/enums';

import { assetTypeFilterAtom } from '../../collaterals.store';

import styles from './Filters.module.scss';

export const Filters = memo(() => {
  const [groupFilter, setGroupFilter] = useAtom(assetTypeFilterAtom);
  const { t } = useTranslation();

  const options = [
    {
      label: t('common.select.market.all'),
      value: AssetTypeE.All,
    },
    {
      label: t('common.select.market.crypto'),
      value: AssetTypeE.Crypto,
    },
    {
      label: t('common.select.market.polymarket'),
      value: AssetTypeE.Prediction,
    },
    {
      label: t('common.select.market.fx'),
      value: AssetTypeE.Fx,
    },
    {
      label: t('common.select.market.metal'),
      value: AssetTypeE.Metal,
    },
    {
      label: t('common.select.market.equity'),
      value: AssetTypeE.Equity,
    },
    {
      label: t('common.select.market.commodities'),
      value: AssetTypeE.Commodity,
    },
  ];

  const handleClick = (value: AssetTypeE) => {
    if (value === AssetTypeE.All) {
      setGroupFilter(null);
    } else {
      setGroupFilter(groupFilter === value ? null : value);
    }
  };

  return (
    <div className={styles.container}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant="outlined"
          className={classnames({
            [styles.selected]:
              groupFilter === option.value || (groupFilter === null && option.value === AssetTypeE.All),
          })}
          onClick={() => handleClick(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
});

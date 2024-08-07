import { useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

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
      label: t('common.select.market.prediction'),
      value: AssetTypeE.Prediction,
    },
    {
      label: t('common.select.market.fx'),
      value: AssetTypeE.Fx,
    },
    {
      label: t('common.select.market.commodity'),
      value: AssetTypeE.Metal,
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
        <div
          key={option.value}
          className={
            groupFilter === option.value || (groupFilter === null && option.value === AssetTypeE.All)
              ? styles.active
              : styles.inactive
          }
          onClick={() => handleClick(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
});

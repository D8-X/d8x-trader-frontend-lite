import { useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { AssetTypeE } from 'context/websocket-context/candles/types';

import { assetTypeFilterAtom } from '../../collaterals.store';

import styles from './Filters.module.scss';

export const Filters = memo(() => {
  const [groupFilter, setGroupFilter] = useAtom(assetTypeFilterAtom);
  const { t } = useTranslation();

  const options = [
    {
      label: t('common.select.market.crypto'),
      value: AssetTypeE.Crypto,
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

  return (
    <div className={styles.container}>
      {options.map((option) => (
        <div
          key={option.value}
          className={groupFilter === option.value ? styles.active : styles.inactive}
          onClick={() => {
            if (groupFilter === option.value) {
              return setGroupFilter(null);
            }
            return setGroupFilter(option.value);
          }}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
});

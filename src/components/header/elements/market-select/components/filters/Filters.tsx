import { useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { groupFilterAtom } from '../../collaterals.store';
import { TokenGroupE } from '../../constants';

import styles from './Filters.module.scss';

export const Filters = memo(() => {
  const [groupFilter, setGroupFilter] = useAtom(groupFilterAtom);
  const { t } = useTranslation();

  const options = [
    {
      label: t('common.select.market.crypto'),
      value: TokenGroupE.CRYPTO,
    },
    {
      label: t('common.select.market.fx'),
      value: TokenGroupE.FX,
    },
    {
      label: t('common.select.market.commodity'),
      value: TokenGroupE.COMMODITY,
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

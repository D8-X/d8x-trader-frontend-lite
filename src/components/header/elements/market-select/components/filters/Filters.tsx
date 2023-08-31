import { useAtom } from 'jotai';
import { memo } from 'react';

import { groupFilterAtom } from '../../collaterals.store';
import { TokenGroupE } from '../../constants';

import styles from './Filters.module.scss';

const options = [
  {
    label: 'Crypto',
    value: TokenGroupE.CRYPTO,
  },
  {
    label: 'FX',
    value: TokenGroupE.FX,
  },
  {
    label: 'Commodity',
    value: TokenGroupE.COMMODITY,
  },
];

export const Filters = memo(() => {
  const [groupFilter, setGroupFilter] = useAtom(groupFilterAtom);

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

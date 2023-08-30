import { atom, useAtom } from 'jotai';
import styles from './Tabs.module.scss';

enum TokenGroupsE {
  CRYPTO,
  FX,
  COMMODITY,
}

const options = [
  {
    label: 'Crypto',
    value: TokenGroupsE.CRYPTO,
  },
  {
    label: 'FX',
    value: TokenGroupsE.FX,
  },
  {
    label: 'Commodity',
    value: TokenGroupsE.COMMODITY,
  },
];

export const tokenGroups: { [key in TokenGroupsE]: string[] } = {
  [TokenGroupsE.CRYPTO]: ['MATIC', 'ETC', 'BTC'],
  [TokenGroupsE.FX]: ['CHF', 'XAU', 'GBP'],
  [TokenGroupsE.COMMODITY]: [],
};

export const groupFilterAtom = atom<TokenGroupsE | null>(null);

export const Tabs = () => {
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
};

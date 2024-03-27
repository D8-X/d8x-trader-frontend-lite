import { Suspense, useMemo } from 'react';

import { getDynamicLogo } from 'utils/getDynamicLogo';
import { TemporaryAnyT } from 'types/types';

import styles from './AssetLine.module.scss';

interface AssetLinePropsI {
  symbol: string;
  value: string | number;
}

export const AssetLine = ({ symbol, value }: AssetLinePropsI) => {
  const IconComponent = useMemo(() => getDynamicLogo(symbol.toLowerCase()) as TemporaryAnyT, [symbol]);

  return (
    <div className={styles.root}>
      <div className={styles.label}>
        <Suspense fallback={null}>
          <IconComponent width={24} height={24} />
        </Suspense>
        <div className={styles.text}>{symbol}</div>
      </div>
      <div>{value}</div>
    </div>
  );
};

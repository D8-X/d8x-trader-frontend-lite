import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';

import styles from './AssetLine.module.scss';

interface AssetLinePropsI {
  symbol: string;
  value: string | number;
}

export const AssetLine = ({ symbol, value }: AssetLinePropsI) => {
  return (
    <div className={styles.root}>
      <div className={styles.label}>
        <DynamicLogo logoName={symbol.toLowerCase()} width={24} height={24} />
        <div className={styles.text}>{symbol}</div>
      </div>
      <div>{value}</div>
    </div>
  );
};

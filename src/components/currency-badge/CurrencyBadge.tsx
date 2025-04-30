import classnames from 'classnames';

import { AssetTypeE } from 'types/enums';

import styles from './CurrencyBadge.module.scss';

interface CurrencyBadgePropsI {
  assetType?: AssetTypeE;
  label: string;
  className?: string;
  withPoint?: boolean;
}

export const CurrencyBadge = ({ assetType, label, className, withPoint }: CurrencyBadgePropsI) => {
  if (!assetType) {
    return null;
  }

  return (
    <span
      className={classnames(styles.badge, className, {
        [styles.crypto]: assetType === AssetTypeE.Crypto,
        [styles.prediction]: assetType === AssetTypeE.Prediction,
        [styles.fx]: assetType === AssetTypeE.Fx,
        [styles.metal]: assetType === AssetTypeE.Metal,
        [styles.commodity]: assetType === AssetTypeE.Commodity,
        [styles.equity]: assetType === AssetTypeE.Equity,
        [styles.withPoint]: withPoint,
      })}
    >
      {label}
    </span>
  );
};

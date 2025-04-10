import styles from './AssetsBlock.module.scss';
import { Perpetuals as PerpetualsTab } from './components/perpetuals/Perpetuals';

export enum PortfolioTabsE {
  Perpetuals,
  Vault,
}

export const AssetsBlock = () => {
  return (
    <div className={styles.mainBlock}>
      <div className={styles.contentBlock}>
        <PerpetualsTab />
      </div>
    </div>
  );
};

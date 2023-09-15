import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AssetsBlock.module.scss';
import { Perpetuals as PerpetualsTab } from './components/perpetuals/Perpetuals';
import { Tabs } from './tabs/Tabs';
import { Vault as VaultTab } from './components/vault/Vault';

export enum PortfolioTabsE {
  Perpetuals,
  Vault,
}

export const AssetsBlock = () => {
  const [currentTab, setCurrentTab] = useState(PortfolioTabsE.Perpetuals);
  const { t } = useTranslation();

  const options = [
    {
      label: t('pages.portfolio.perpetuals'),
      value: PortfolioTabsE.Perpetuals,
    },
    {
      label: t('pages.portfolio.vault'),
      value: PortfolioTabsE.Vault,
    },
  ];

  return (
    <div className={styles.mainBlock}>
      <div className={styles.tabsContainer}>
        <Tabs options={options} currentValue={currentTab} setCurrentValue={setCurrentTab} />
      </div>
      <div className={styles.separator} />
      <div className={styles.contentBlock}>
        {currentTab === PortfolioTabsE.Perpetuals ? <PerpetualsTab /> : <VaultTab />}
      </div>
    </div>
  );
};

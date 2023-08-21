import classnames from 'classnames';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { ReferTabIdE } from 'pages/refer-page/constants';

import styles from './TabSelector.module.scss';

interface TabSelectorPropsI {
  activeTab: ReferTabIdE;
  onTabChange: (newIndex: ReferTabIdE) => void;
}

interface TabItemI {
  tabId: ReferTabIdE;
  label: string;
}

export const TabSelector = ({ activeTab, onTabChange }: TabSelectorPropsI) => {
  const { t } = useTranslation();

  const tabItems: TabItemI[] = useMemo(
    () => [
      {
        tabId: ReferTabIdE.Trader,
        label: t('pages.refer.tab-selector.trader'),
      },
      {
        tabId: ReferTabIdE.Referral,
        label: t('pages.refer.tab-selector.referrer'),
      },
    ],
    [t]
  );

  return (
    <Box className={styles.root}>
      {tabItems.map((tab) => (
        <Box
          key={tab.tabId}
          onClick={() => onTabChange(tab.tabId)}
          className={classnames(styles.tab, {
            [styles.active]: tab.tabId === activeTab,
            [styles.inactive]: tab.tabId !== activeTab,
          })}
        >
          <Typography variant="bodyMedium">{tab.label}</Typography>
        </Box>
      ))}
    </Box>
  );
};

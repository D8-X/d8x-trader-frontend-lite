import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';

import { DarkModeSelect } from './components/dark-mode/DarkModeSelect';
import { DefaultCurrencySelect } from './components/default-currency/DefaultCurrencySelect';
import { OrderBlockSelect } from './components/order-block/OrderBlockSelect';

import styles from './SettingsBlock.module.scss';

export const SettingsBlock = memo(() => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isBigScreen = useMediaQuery(theme.breakpoints.up('lg'));

  return (
    <Box className={styles.root}>
      {isBigScreen && (
        <Box className={styles.optionRow}>
          <Typography variant="bodyMedium" className={styles.setting}>
            {t('common.settings.ui-settings.order-block.title')}
          </Typography>
          <OrderBlockSelect />
        </Box>
      )}
      <Box className={styles.optionRow}>
        <Typography variant="bodyMedium" className={styles.setting}>
          {t('common.settings.ui-settings.theme.title')}
        </Typography>
        <DarkModeSelect />
      </Box>
      <Box className={styles.optionRow}>
        <Typography variant="bodyMedium" className={styles.setting}>
          {t('common.settings.ui-settings.default-currency.title')}
        </Typography>
        <DefaultCurrencySelect />
      </Box>
    </Box>
  );
});

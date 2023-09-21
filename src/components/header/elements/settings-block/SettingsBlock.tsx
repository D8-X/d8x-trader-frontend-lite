import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Build } from '@mui/icons-material';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';

import styles from './SettingsBlock.module.scss';
import { DarkModeSelect } from './components/dark-mode/DarkModeSelect';
import { DefaultCurrencySelect } from './components/default-currency/DefaultCurrencySelect';
import { OrderBlockSelect } from './components/order-block/OrderBlockSelect';
import { OneClickTradingSelect } from './components/one-click-trading/OneClickTradingSelect';

export const SettingsBlock = memo(() => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isBigScreen = useMediaQuery(theme.breakpoints.up('lg'));

  return (
    <Box className={styles.root}>
      <Box className={styles.labelRow}>
        <Typography variant="bodyMedium" className={styles.label}>
          <Build className={styles.labelIcon} />
          {t('common.settings.ui-settings.title')}
        </Typography>
      </Box>
      <Box className={styles.optionRow}>
        <Typography variant="bodyMedium" className={styles.setting}>
          {t('common.settings.ui-settings.one-click-trading.title')}
        </Typography>
        <OneClickTradingSelect />
      </Box>
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
          {t('common.settings.ui-settings.dark-mode.title')}
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

import { useAtom } from 'jotai';
import { type ChangeEvent, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Switch, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Build } from '@mui/icons-material';

import { enabledDarkModeAtom, orderBlockPositionAtom } from 'store/app.store';
import { OrderBlockPositionE } from 'types/enums';

import styles from './SettingsBlock.module.scss';

export const SettingsBlock = memo(() => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isBigScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const [orderBlockPosition, setOrderBlockPosition] = useAtom(orderBlockPositionAtom);
  const [enabledDarkMode, setEnabledDarkMode] = useAtom(enabledDarkModeAtom);

  const handleOrderBlockChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOrderBlockPosition(event.target.checked ? OrderBlockPositionE.Right : OrderBlockPositionE.Left);
  };

  const handleEnabledDarkMode = (event: ChangeEvent<HTMLInputElement>) => {
    setEnabledDarkMode(event.target.checked);
  };

  return (
    <Box className={styles.root}>
      <Box className={styles.labelRow}>
        <Typography variant="bodyMedium" className={styles.label}>
          <Build className={styles.labelIcon} />
          {t('common.settings.ui-settings.title')}
        </Typography>
      </Box>
      {isBigScreen && (
        <Box className={styles.optionRow}>
          <Typography variant="bodyMedium" className={styles.setting}>
            {t('common.settings.ui-settings.order-block')}
          </Typography>
          <Switch
            className={styles.switch}
            checked={orderBlockPosition === OrderBlockPositionE.Right}
            onChange={handleOrderBlockChange}
          />
        </Box>
      )}
      <Box className={styles.optionRow}>
        <Typography variant="bodyMedium" className={styles.setting}>
          {t('common.settings.ui-settings.dark-mode')}
        </Typography>
        <Switch className={styles.switch} checked={enabledDarkMode} onChange={handleEnabledDarkMode} />
      </Box>
    </Box>
  );
});

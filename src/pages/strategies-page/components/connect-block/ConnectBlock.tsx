import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { strategyAddressAtom } from 'store/strategies.store';

import styles from './ConnectBlock.module.scss';

export const ConnectBlock = () => {
  const { t } = useTranslation();

  const setStrategyAddress = useSetAtom(strategyAddressAtom);

  return (
    <div className={styles.root}>
      <Typography variant="h6" className={styles.title}>
        {t('pages.strategies.connect.title')}
      </Typography>
      <Button onClick={() => setStrategyAddress('address')} className={styles.connectButton} variant="primary">
        <span className={styles.modalButtonText}>{t('pages.strategies.connect.connect-button')}</span>
      </Button>
    </div>
  );
};

import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useWalletClient } from 'wagmi';

import { Button, Typography } from '@mui/material';

import { strategyAddressAtom } from 'store/strategies.store';
import { getStrategyAddress } from 'blockchain-api/getStrategyAddress';

import styles from './ConnectBlock.module.scss';

export const ConnectBlock = () => {
  const { t } = useTranslation();

  const setStrategyAddress = useSetAtom(strategyAddressAtom);

  const { data: walletClient } = useWalletClient();

  const handleConnect = useCallback(() => {
    if (walletClient) {
      getStrategyAddress(walletClient).then((addr) => {
        setStrategyAddress(addr);
      });
    }
  }, [walletClient, setStrategyAddress]);

  return (
    <div className={styles.root}>
      <Typography variant="h6" className={styles.title}>
        {t('pages.strategies.connect.title')}
      </Typography>
      <Button onClick={handleConnect} className={styles.connectButton} variant="primary">
        <span className={styles.modalButtonText}>{t('pages.strategies.connect.connect-button')}</span>
      </Button>
    </div>
  );
};

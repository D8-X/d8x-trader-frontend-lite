import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { hasPositionAtom } from 'store/strategies.store';

import styles from './ExitStrategy.module.scss';
import { useChainId, useWalletClient } from 'wagmi';
import { traderAPIAtom } from 'store/pools.store';
import { useCallback } from 'react';
import { exitStrategy } from 'blockchain-api/contract-interactions/exitStrategy';
import { STRATEGY_CHAINS, STRATEGY_SYMBOL } from 'appConstants';

export const ExitStrategy = () => {
  const { t } = useTranslation();

  const chainId = useChainId();

  const { data: walletClient } = useWalletClient();

  const traderAPI = useAtomValue(traderAPIAtom);

  const setHasPosition = useSetAtom(hasPositionAtom);

  const handleExit = useCallback(() => {
    if (!walletClient || !traderAPI || !STRATEGY_CHAINS.includes(chainId)) {
      return;
    }
    exitStrategy({ chainId, walletClient, symbol: STRATEGY_SYMBOL, traderAPI }).then(({ hash }) => {
      console.log(`submitting strategy txn ${hash}`);
      setHasPosition(false);
    });
  }, [chainId, walletClient, traderAPI, setHasPosition]);

  return (
    <div className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {t('pages.strategies.exit.title')}
      </Typography>
      <Typography variant="bodySmall" className={styles.note}>
        {t('pages.strategies.exit.note')}
      </Typography>
      <Button onClick={handleExit} className={styles.button} variant="primary">
        <span className={styles.modalButtonText}>{t('pages.strategies.exit.exit-button')}</span>
      </Button>
    </div>
  );
};

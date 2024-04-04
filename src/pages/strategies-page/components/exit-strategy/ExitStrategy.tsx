import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainId, useWalletClient } from 'wagmi';

import { Button, DialogActions, DialogTitle, Typography } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { exitStrategy } from 'blockchain-api/contract-interactions/exitStrategy';
import { Dialog } from 'components/dialog/Dialog';
import { pagesConfig } from 'config';
import { traderAPIAtom } from 'store/pools.store';
import { hasPositionAtom } from 'store/strategies.store';

import styles from './ExitStrategy.module.scss';

export const ExitStrategy = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const traderAPI = useAtomValue(traderAPIAtom);
  const setHasPosition = useSetAtom(hasPositionAtom);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const requestSentRef = useRef(false);

  const handleExit = useCallback(() => {
    if (
      requestSentRef.current ||
      !walletClient ||
      !traderAPI ||
      !pagesConfig.enabledStrategiesPageByChains.includes(chainId)
    ) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    exitStrategy({ chainId, walletClient, symbol: STRATEGY_SYMBOL, traderAPI })
      .then(({ hash }) => {
        console.log(`submitting strategy txn ${hash}`);
        setHasPosition(false);
        setShowConfirmModal(false);
      })
      .finally(() => {
        requestSentRef.current = false;
        setRequestSent(false);
      });
  }, [chainId, walletClient, traderAPI, setHasPosition]);

  const handleModalClose = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  return (
    <div className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {t('pages.strategies.exit.title')}
      </Typography>
      <Typography variant="bodySmall" className={styles.note}>
        {t('pages.strategies.exit.note')}
      </Typography>
      <Button onClick={() => setShowConfirmModal(true)} className={styles.button} variant="primary">
        <span className={styles.modalButtonText}>{t('pages.strategies.exit.exit-button')}</span>
      </Button>

      <Dialog open={showConfirmModal} className={styles.dialog}>
        <DialogTitle>{t('pages.strategies.exit.confirm-modal.title')}</DialogTitle>
        <div className={styles.dialogRoot}>
          <Typography variant="bodyMedium" fontWeight={600}>
            {t('pages.strategies.exit.confirm-modal.text')}
          </Typography>
        </div>
        <DialogActions className={styles.dialogAction}>
          <Button onClick={handleModalClose} variant="secondary" size="small">
            {t('common.cancel-button')}
          </Button>
          <Button onClick={handleExit} variant="warning" size="small" disabled={requestSent}>
            {t('pages.strategies.exit.confirm-modal.confirm-button')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

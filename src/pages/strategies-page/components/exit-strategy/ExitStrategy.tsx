import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useSendTransaction, useWalletClient } from 'wagmi';

import { EmojiFoodBeverageOutlined } from '@mui/icons-material';
import { Button, CircularProgress, DialogActions, DialogTitle, Typography } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { exitStrategy } from 'blockchain-api/contract-interactions/exitStrategy';
import { Dialog } from 'components/dialog/Dialog';
import { ToastContent } from 'components/toast-content/ToastContent';
import { pagesConfig } from 'config';
import { traderAPIAtom } from 'store/pools.store';
import { strategyAddressesAtom } from 'store/strategies.store';

import { useExitStrategy } from './hooks/useExitStrategy';

import styles from './ExitStrategy.module.scss';

interface ExitStrategyPropsI {
  isLoading: boolean;
  hasBuyOpenOrder: boolean;
}

export const ExitStrategy = ({ isLoading, hasBuyOpenOrder }: ExitStrategyPropsI) => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { sendTransactionAsync } = useSendTransaction();

  const traderAPI = useAtomValue(traderAPIAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(isLoading);
  const [currentPhaseKey, setCurrentPhaseKey] = useState('');

  const requestSentRef = useRef(false);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  const { setTxHash } = useExitStrategy();

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
    setCurrentPhaseKey('');
    setShowConfirmModal(false);
    setRequestSent(true);
    setLoading(true);

    exitStrategy(
      { chainId, walletClient, symbol: STRATEGY_SYMBOL, traderAPI, strategyAddress },
      sendTransactionAsync,
      setCurrentPhaseKey
    )
      .then(({ hash }) => {
        // console.log(`submitting close strategy txn ${hash}`);
        setTxHash(hash);
        setCurrentPhaseKey('pages.strategies.exit.phases.waiting');
      })
      .catch((error) => {
        console.error(error);
        toast.error(<ToastContent title={error.shortMessage || error.message} bodyLines={[]} />);
        setLoading(false);
      })
      .finally(() => {
        requestSentRef.current = false;
        setRequestSent(false);
      });
  }, [chainId, walletClient, traderAPI, strategyAddress, sendTransactionAsync, setTxHash]);

  const handleModalClose = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  useEffect(() => {
    if (isLoading && hasBuyOpenOrder) {
      setCurrentPhaseKey('pages.strategies.exit.phases.waiting');
    } else if (isLoading) {
      setCurrentPhaseKey('pages.strategies.exit.phases.sending');
    }
  }, [isLoading, hasBuyOpenOrder]);

  return (
    <div className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {t('pages.strategies.exit.title')}
      </Typography>
      <Typography variant="bodySmall" className={styles.note}>
        {t('pages.strategies.exit.note')}
      </Typography>
      <Button onClick={() => setShowConfirmModal(true)} className={styles.button} variant="primary" disabled={loading}>
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
          <Button onClick={handleModalClose} variant="secondary">
            {t('common.cancel-button')}
          </Button>
          <Button onClick={handleExit} variant="primary" disabled={requestSent || loading}>
            {t('pages.strategies.exit.confirm-modal.confirm-button')}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <div className={styles.loaderWrapper}>
          <CircularProgress />
          {currentPhaseKey && (
            <span className={styles.phase}>
              <EmojiFoodBeverageOutlined fontSize="small" />
              {t(currentPhaseKey)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

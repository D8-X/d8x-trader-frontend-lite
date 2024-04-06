import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Address } from 'viem';
import { useAccount, useChainId, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, CircularProgress, DialogActions, DialogTitle, Typography } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { exitStrategy } from 'blockchain-api/contract-interactions/exitStrategy';
import { Dialog } from 'components/dialog/Dialog';
import { ToastContent } from 'components/toast-content/ToastContent';
import { pagesConfig } from 'config';
import { traderAPIAtom } from 'store/pools.store';
import { enableFrequentUpdatesAtom, strategyAddressesAtom } from 'store/strategies.store';

import styles from './ExitStrategy.module.scss';

export const ExitStrategy = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const traderAPI = useAtomValue(traderAPIAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const enableFrequentUpdates = useSetAtom(enableFrequentUpdatesAtom);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);

  const requestSentRef = useRef(false);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  const { isSuccess, isError, isFetched, error } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!txHash },
  });

  useEffect(() => {
    if (!isFetched || !txHash) {
      return;
    }
    setTxHash(undefined);
  }, [isFetched, txHash]);

  useEffect(() => {
    if (!isError || !error || !txHash) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('pages.strategies.exit.toasts.tx-failed.title')}
        bodyLines={[
          {
            label: t('pages.strategies.exit.toasts.tx-failed.body'),
            value: error.message,
          },
        ]}
      />
    );
  }, [isError, error, txHash, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    toast.success(<ToastContent title={t('pages.strategies.exit.toasts.tx-submitted.title')} bodyLines={[]} />);
    enableFrequentUpdates(true);
  }, [isSuccess, txHash, enableFrequentUpdates, t]);

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
    setShowConfirmModal(false);
    setRequestSent(true);
    setLoading(true);

    exitStrategy({ chainId, walletClient, symbol: STRATEGY_SYMBOL, traderAPI, strategyAddress })
      .then(({ hash }) => {
        console.log(`submitting strategy txn ${hash}`);
        setTxHash(hash);
      })
      .finally(() => {
        requestSentRef.current = false;
        setRequestSent(false);
      });
  }, [chainId, walletClient, traderAPI, strategyAddress]);

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
          <Button onClick={handleModalClose} variant="secondary" size="small">
            {t('common.cancel-button')}
          </Button>
          <Button onClick={handleExit} variant="primary" size="small" disabled={requestSent || loading}>
            {t('pages.strategies.exit.confirm-modal.confirm-button')}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <div className={styles.loaderWrapper}>
          <CircularProgress />
        </div>
      )}
    </div>
  );
};

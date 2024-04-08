import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Button, CircularProgress, DialogActions, DialogTitle, Typography } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { exitStrategy } from 'blockchain-api/contract-interactions/exitStrategy';
import { Dialog } from 'components/dialog/Dialog';
import { pagesConfig } from 'config';
import { traderAPIAtom } from 'store/pools.store';
import { strategyAddressesAtom } from 'store/strategies.store';

import styles from './ExitStrategy.module.scss';
import { useExitStrategy } from './hooks/useExitStrategy';
import { toast } from 'react-toastify';
import { ToastContent } from '../../../../components/toast-content/ToastContent';

interface ExitStrategyPropsI {
  isLoading: boolean;
}

export const ExitStrategy = ({ isLoading }: ExitStrategyPropsI) => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const traderAPI = useAtomValue(traderAPIAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(isLoading);

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
    setShowConfirmModal(false);
    setRequestSent(true);
    setLoading(true);

    exitStrategy({ chainId, walletClient, symbol: STRATEGY_SYMBOL, traderAPI, strategyAddress })
      .then(({ hash }) => {
        console.log(`submitting close strategy txn ${hash}`);
        setTxHash(hash);
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
  }, [chainId, walletClient, traderAPI, strategyAddress, setTxHash]);

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
        </div>
      )}
    </div>
  );
};

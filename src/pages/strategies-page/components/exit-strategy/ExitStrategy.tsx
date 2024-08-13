import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useSendTransaction, useWalletClient } from 'wagmi';
import { WalletClient } from 'viem';

import { EmojiFoodBeverageOutlined } from '@mui/icons-material';
import { Button, CircularProgress, DialogActions, DialogTitle, Typography } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { exitStrategy } from 'blockchain-api/contract-interactions/exitStrategy';
import { Dialog } from 'components/dialog/Dialog';
import { ToastContent } from 'components/toast-content/ToastContent';
import { pagesConfig } from 'config';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { traderAPIAtom } from 'store/pools.store';
import { hasPositionAtom, strategyAddressesAtom } from 'store/strategies.store';
import { isEnabledChain } from 'utils/isEnabledChain';

import { useExitStrategy } from './hooks/useExitStrategy';

import styles from './ExitStrategy.module.scss';
import { claimStrategyFunds } from 'blockchain-api/contract-interactions/claimStrategyFunds';

interface ExitStrategyPropsI {
  isLoading: boolean;
  hasBuyOpenOrder: boolean;
  strategyClient: WalletClient;
  strategyAddressBalance: number;
}

export const ExitStrategy = ({
  isLoading,
  hasBuyOpenOrder,
  strategyClient,
  strategyAddressBalance,
}: ExitStrategyPropsI) => {
  const { t } = useTranslation();

  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { sendTransactionAsync } = useSendTransaction();

  const { isMultisigAddress } = useUserWallet();

  const traderAPI = useAtomValue(traderAPIAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const hasPosition = useAtomValue(hasPositionAtom);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(isLoading);
  const [currentPhaseKey, setCurrentPhaseKey] = useState('');

  const requestSentRef = useRef(false);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  const { isExecuted, setTxHash, setOrderId } = useExitStrategy();

  const handleExit = useCallback(() => {
    if (
      requestSentRef.current ||
      !walletClient ||
      !traderAPI ||
      !isEnabledChain(chainId) ||
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
      { chainId, walletClient, strategyClient, isMultisigAddress, symbol: STRATEGY_SYMBOL, traderAPI, strategyAddress },
      sendTransactionAsync,
      setCurrentPhaseKey
    )
      .then(({ hash, orderIds }) => {
        // console.log(`submitting close strategy txn ${hash}`);
        setTxHash(hash);
        setOrderId(orderIds[0]);
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
        setLoading(false);
      });
  }, [
    chainId,
    walletClient,
    strategyClient,
    isMultisigAddress,
    traderAPI,
    strategyAddress,
    sendTransactionAsync,
    setTxHash,
    setOrderId,
  ]);

  const claimRequestSentRef = useRef(false);

  const claimFunds = useCallback(() => {
    if (
      claimRequestSentRef.current ||
      !walletClient ||
      !traderAPI ||
      !isEnabledChain(chainId) ||
      !pagesConfig.enabledStrategiesPageByChains.includes(chainId)
    ) {
      console.log('early exit');
      return;
    }

    claimRequestSentRef.current = true;
    setCurrentPhaseKey('');
    setShowConfirmModal(false);
    setRequestSent(true);
    setLoading(true);

    console.log('claimStrategyFunds');

    claimStrategyFunds(
      {
        chainId,
        walletClient,
        strategyClient,
        isMultisigAddress,
        symbol: STRATEGY_SYMBOL,
        traderAPI,
      },
      sendTransactionAsync
    )
      .then(({ hash }) => {
        console.log({ hash });
        if (hash) {
          setTxHash(hash);
          //console.log('claiming funds::success');
        } else {
          //console.log('claiming funds::no hash');
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error(<ToastContent title={error.shortMessage || error.message} bodyLines={[]} />);
        setLoading(false);
      })
      .finally(() => {
        console.log('finally');

        claimRequestSentRef.current = false;
        setRequestSent(false);
        setLoading(false);
      });
  }, [chainId, walletClient, strategyClient, isMultisigAddress, traderAPI, sendTransactionAsync, setTxHash]);

  useEffect(() => {
    if (isExecuted && !isMultisigAddress) {
      claimFunds();
    }
  }, [isExecuted, isMultisigAddress, claimFunds]);

  const handleClick = !hasPosition && strategyAddressBalance > 0 ? claimFunds : handleExit;

  const handleModalClose = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading && hasBuyOpenOrder) {
      setCurrentPhaseKey('pages.strategies.exit.phases.waiting');
    } else if (isLoading) {
      setCurrentPhaseKey('pages.strategies.exit.phases.sending');
    }
  }, [isLoading, hasBuyOpenOrder]);

  const buttonLabel = useMemo(() => {
    if (!hasPosition && strategyAddressBalance) {
      return t('pages.strategies.claim-funds.claim-button');
    } else {
      return t('pages.strategies.exit.exit-button');
    }
  }, [strategyAddressBalance, hasPosition, t]);

  return (
    <div className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {t('pages.strategies.exit.title')}
      </Typography>
      <Typography variant="bodySmall" className={styles.note}>
        {t('pages.strategies.exit.note')}
      </Typography>
      <Button onClick={() => setShowConfirmModal(true)} className={styles.button} variant="primary" disabled={loading}>
        <span className={styles.modalButtonText}>{buttonLabel}</span>
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
          <Button
            onClick={handleClick}
            variant="primary"
            disabled={
              requestSent ||
              loading ||
              !walletClient ||
              !traderAPI ||
              !isEnabledChain(chainId) ||
              !pagesConfig.enabledStrategiesPageByChains.includes(chainId)
            }
          >
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

import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { Box, Button, CircularProgress, Typography } from '@mui/material';

import { hasDelegate } from 'blockchain-api/contract-interactions/hasDelegate';
import { generateDelegate } from 'blockchain-api/generateDelegate';
import { removeDelegate } from 'blockchain-api/contract-interactions/removeDelegate';
import { setDelegate } from 'blockchain-api/contract-interactions/setDelegate';
import { getStorageKey } from 'blockchain-api/getStorageKey';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getDelegateKey } from 'helpers/getDelegateKey';
import { enabledOneClickTradingAtom } from 'store/app.store';
import { proxyAddrAtom } from 'store/pools.store';

import styles from './OneClickTradingDialog.module.scss';

interface OneClickModalPropsI {
  isSettingsOpen: boolean;
}

export const OneClickTradingModal = ({ isSettingsOpen }: OneClickModalPropsI) => {
  const { t } = useTranslation();

  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [enabledOneClickTrading] = useAtom(enabledOneClickTradingAtom);
  const [proxyAddr] = useAtom(proxyAddrAtom);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isActionLoading, setActionLoading] = useState(false);
  const [isDelegated, setDelegated] = useState<boolean | null>(null);

  const isSettingsOpenRef = useRef(isSettingsOpen);
  const handleRemoveRef = useRef(false);
  const handleActivateRef = useRef(false);
  const handleCreateRef = useRef(false);

  useEffect(() => {
    isSettingsOpenRef.current = isSettingsOpen;
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!proxyAddr || !address) {
      return;
    }

    if (enabledOneClickTrading && isSettingsOpenRef.current) {
      setLoading(true);

      hasDelegate(publicClient, proxyAddr as Address, address)
        .then(setDelegated)
        .finally(() => setLoading(false));
      setModalOpen(true);
    }
  }, [enabledOneClickTrading, publicClient, proxyAddr, address]);

  const onClose = () => {
    setModalOpen(false);
  };

  const handleCreate = async () => {
    if (!walletClient || !proxyAddr || !address || handleActivateRef.current) {
      return;
    }

    handleCreateRef.current = true;
    setActionLoading(true);

    // TODO: VOV: Check order with documentation. We don't have storageKey for generateDelegate to start with it.
    const storageKey = await getStorageKey(walletClient);
    await generateDelegate(walletClient, storageKey);
    // TODO: VOV: Need to add try / catch blocks. Can't really test it
    await setDelegate(walletClient, proxyAddr as Address, address);

    toast.success(
      <ToastContent title={t('common.settings.one-click-modal.create-delegate.create-success-result')} bodyLines={[]} />
    );

    handleCreateRef.current = false;
    setActionLoading(false);
  };

  const handleActivate = async () => {
    if (!walletClient || !proxyAddr || handleActivateRef.current) {
      return;
    }

    handleActivateRef.current = true;
    setActionLoading(true);

    try {
      const storageKey = await getStorageKey(walletClient);
      const delegateKey = getDelegateKey(walletClient, storageKey);
      if (!delegateKey) {
        await generateDelegate(walletClient, storageKey);
        toast.success(
          <ToastContent
            title={t('common.settings.one-click-modal.manage-delegate.activate-success-result')}
            bodyLines={[]}
          />
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        <ToastContent
          title={t('common.settings.one-click-modal.manage-delegate.activate-error-result')}
          bodyLines={[]}
        />
      );
    }

    handleActivateRef.current = false;
    setActionLoading(false);
  };

  const handleRemove = () => {
    if (!walletClient || !proxyAddr || handleRemoveRef.current) {
      return;
    }

    handleRemoveRef.current = true;
    setActionLoading(true);

    removeDelegate(walletClient, proxyAddr as Address)
      .then((result) => {
        console.debug('Remove action hash: ', result.hash);
        toast.success(
          <ToastContent
            title={t('common.settings.one-click-modal.manage-delegate.remove-action-result')}
            bodyLines={[]}
          />
        );
      })
      .finally(() => {
        handleRemoveRef.current = false;
        setActionLoading(false);
      });
  };

  return (
    <Dialog open={isModalOpen} onClose={onClose}>
      <Box className={styles.dialogContent}>
        <Typography variant="h4" className={styles.title}>
          {t('common.settings.one-click-modal.title')}
        </Typography>
        <Typography variant="bodyMedium">{t('common.settings.one-click-modal.description')}</Typography>
      </Box>
      <Separator />
      <Box className={styles.dialogContent}>
        {isLoading && isDelegated === null ? (
          <div className={styles.spinnerContainer}>
            <CircularProgress />
          </div>
        ) : (
          <>
            <Typography variant="h6">
              {t(`common.settings.one-click-modal.${isDelegated ? 'manage' : 'create'}-delegate.title`)}
            </Typography>
            <Typography variant="bodyMedium">
              {t(`common.settings.one-click-modal.${isDelegated ? 'manage' : 'create'}-delegate.description`)}
            </Typography>
          </>
        )}
      </Box>
      <Separator />
      <Box className={styles.dialogContent}>
        <Box className={styles.actionButtonsContainer}>
          <Button variant="secondary" className={styles.cancelButton} onClick={onClose}>
            {t('pages.refer.trader-tab.cancel')}
          </Button>
          {!isLoading && isDelegated === false && (
            <Button variant="primary" className={styles.actionButton} onClick={handleCreate} disabled={isActionLoading}>
              Create
            </Button>
          )}
          {!isLoading && isDelegated === true && (
            <>
              <Button
                variant="primary"
                className={styles.actionButton}
                onClick={handleActivate}
                disabled={isActionLoading}
              >
                Activate
              </Button>
              <Button
                variant="primary"
                className={styles.actionButton}
                onClick={handleRemove}
                disabled={isActionLoading}
              >
                Remove
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

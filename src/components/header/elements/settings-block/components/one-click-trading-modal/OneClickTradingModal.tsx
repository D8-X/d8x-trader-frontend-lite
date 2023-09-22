import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';

import { Settings } from '@mui/icons-material';
import { Box, Button, CircularProgress, Tooltip, Typography } from '@mui/material';

import { hasDelegate } from 'blockchain-api/contract-interactions/hasDelegate';
import { removeDelegate } from 'blockchain-api/contract-interactions/removeDelegate';
import { setDelegate } from 'blockchain-api/contract-interactions/setDelegate';
import { generateDelegate } from 'blockchain-api/generateDelegate';
import { getStorageKey } from 'blockchain-api/getStorageKey';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getDelegateKey } from 'helpers/getDelegateKey';
import { activatedOneClickTradingAtom } from 'store/app.store';
import { storageKeyAtom } from 'store/order-block.store';
import { proxyAddrAtom } from 'store/pools.store';

import { FundingModal } from './FundingModal';
import styles from './OneClickTradingDialog.module.scss';

export const OneClickTradingModal = () => {
  const { t } = useTranslation();

  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [activatedOneClickTrading, setActivatedOneClickTrading] = useAtom(activatedOneClickTradingAtom);
  const [proxyAddr] = useAtom(proxyAddrAtom);
  const setStorageKey = useSetAtom(storageKeyAtom);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isActionLoading, setActionLoading] = useState(false);
  const [isDelegated, setDelegated] = useState<boolean | null>(null);
  const [delegateAddress, setDelegateAddr] = useState<string>('');

  const handleRemoveRef = useRef(false);
  const handleActivateRef = useRef(false);
  const handleCreateRef = useRef(false);

  useEffect(() => {
    if (!proxyAddr || !address) {
      return;
    }

    setLoading(true);

    hasDelegate(publicClient, proxyAddr as Address, address)
      .then(setDelegated)
      .finally(() => setLoading(false));
  }, [publicClient, proxyAddr, address]);

  const onClose = () => {
    setModalOpen(false);
  };

  const handleCreate = async () => {
    if (!walletClient || !proxyAddr || !address || handleActivateRef.current) {
      return;
    }

    handleCreateRef.current = true;
    setActionLoading(true);

    const storageKey = await getStorageKey(walletClient);
    setStorageKey(storageKey);
    const delegateAddr = await generateDelegate(walletClient, storageKey);
    await setDelegate(walletClient, proxyAddr as Address, delegateAddr);
    setDelegated(true);
    setActivatedOneClickTrading(true);
    setDelegateAddr(delegateAddr);

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
      setStorageKey(storageKey);
      const delegateKey = getDelegateKey(walletClient, storageKey);
      if (!delegateKey) {
        await generateDelegate(walletClient, storageKey);
      }
      setDelegateAddr(privateKeyToAccount(delegateKey as Address).address);
      setActivatedOneClickTrading(true);
      toast.success(
        <ToastContent
          title={t('common.settings.one-click-modal.manage-delegate.activate-success-result')}
          bodyLines={[]}
        />
      );
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

  const [isFundingModalOpen, setFundingModalOpen] = useState(false);

  const { data: delegateBalance } = useBalance({
    address: delegateAddress as Address,
    enabled: delegateAddress !== '',
  });

  useEffect(() => {
    if (activatedOneClickTrading && delegateAddress !== '' && !!delegateBalance && delegateBalance.value === 0n) {
      setFundingModalOpen(true);
    }
  }, [activatedOneClickTrading, delegateBalance, delegateAddress]);

  useEffect(() => {
    if (delegateAddress !== '' && delegateBalance && delegateBalance.value > 0n) {
      setFundingModalOpen(false);
    }
  }, [delegateBalance, delegateAddress]);

  const handleRemove = () => {
    if (!walletClient || !proxyAddr || handleRemoveRef.current) {
      return;
    }

    handleRemoveRef.current = true;
    setActionLoading(true);

    removeDelegate(walletClient, proxyAddr as Address)
      .then((result) => {
        console.debug('Remove action hash: ', result.hash);
        setActivatedOneClickTrading(false);
        setDelegated(false);
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
    <>
      <Tooltip title={t('common.settings.one-click-modal.modal-button')}>
        <Button onClick={() => setModalOpen(true)} className={styles.modalButton} variant="outlined">
          <Typography variant="bodyMedium">{t('common.settings.one-click-modal.modal-button')}</Typography>
          <Settings />
        </Button>
      </Tooltip>

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
              <Button
                variant="primary"
                className={styles.actionButton}
                onClick={handleCreate}
                disabled={isActionLoading}
              >
                Create
              </Button>
            )}
            {!isLoading && isDelegated === true && (
              <>
                <Button
                  variant="primary"
                  className={styles.actionButton}
                  onClick={handleActivate}
                  disabled={isActionLoading || activatedOneClickTrading}
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

      {isFundingModalOpen && (
        <FundingModal
          isOpen={isFundingModalOpen}
          onClose={() => setFundingModalOpen(false)}
          delegateAddress={delegateAddress as Address}
        />
      )}
    </>
  );
};

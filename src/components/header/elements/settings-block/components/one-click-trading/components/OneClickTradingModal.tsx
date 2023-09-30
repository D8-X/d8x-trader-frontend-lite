import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { createWalletClient, type Address, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';

import { Box, Button, CircularProgress, Typography } from '@mui/material';

import { hasDelegate } from 'blockchain-api/contract-interactions/hasDelegate';
import { removeDelegate } from 'blockchain-api/contract-interactions/removeDelegate';
import { setDelegate } from 'blockchain-api/contract-interactions/setDelegate';
import { generateDelegate } from 'blockchain-api/generateDelegate';
import { getStorageKey } from 'blockchain-api/getStorageKey';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getDelegateKey } from 'helpers/getDelegateKey';
import { activatedOneClickTradingAtom, delegateAddressAtom, tradingClientAtom } from 'store/app.store';
import { storageKeyAtom } from 'store/order-block.store';
import { proxyAddrAtom } from 'store/pools.store';

import { FundingModal } from './FundingModal';
import styles from '../OneClickTradingButton.module.scss';

interface OneClickTradingModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const OneClickTradingModal = ({ isOpen, onClose }: OneClickTradingModalPropsI) => {
  const { t } = useTranslation();

  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [activatedOneClickTrading, setActivatedOneClickTrading] = useAtom(activatedOneClickTradingAtom);
  const [delegateAddress, setDelegateAddress] = useAtom(delegateAddressAtom);
  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [storageKey, setStorageKey] = useAtom(storageKeyAtom);
  const setTradingClient = useSetAtom(tradingClientAtom);

  const [isLoading, setLoading] = useState(false);
  const [isActionLoading, setActionLoading] = useState(false);
  const [isDelegated, setDelegated] = useState<boolean | null>(null);

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

  const handleCreate = async () => {
    if (!walletClient || !proxyAddr || !address || handleActivateRef.current) {
      return;
    }

    handleCreateRef.current = true;
    setActionLoading(true);

    const strgKey = await getStorageKey(walletClient);
    setStorageKey(strgKey);
    const delegateAddr = await generateDelegate(walletClient, strgKey);
    await setDelegate(walletClient, proxyAddr as Address, delegateAddr);
    setDelegated(true);
    setActivatedOneClickTrading(true);
    setDelegateAddress(delegateAddr);

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
      const strgKey = await getStorageKey(walletClient);
      setStorageKey(strgKey);
      const delegateKey = getDelegateKey(walletClient, strgKey);
      let generatedAddress;
      if (!delegateKey) {
        generatedAddress = await generateDelegate(walletClient, strgKey);
      } else {
        generatedAddress = privateKeyToAccount(delegateKey as Address).address;
      }
      setDelegateAddress(generatedAddress);
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

  const handleFund = async () => {
    setFundingModalOpen(true);
  };

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

  useEffect(() => {
    if (address && activatedOneClickTrading && storageKey && walletClient?.chain) {
      const dlgt = getDelegateKey(walletClient, storageKey);
      if (dlgt) {
        setTradingClient(
          createWalletClient({
            account: privateKeyToAccount(dlgt as Address),
            chain: walletClient.chain,
            transport: http(),
          })
        );
        return;
      }
    }
    if (walletClient) {
      setTradingClient(walletClient);
    }
  }, [address, walletClient, storageKey, activatedOneClickTrading, setTradingClient]);

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className={styles.dialog}>
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
              {isDelegated ? (
                <div>
                  <div className={styles.infoLine}>
                    <div className={styles.infoTitle}>
                      {t('common.settings.one-click-modal.manage-delegate.status.title')}
                    </div>
                    <div>
                      {activatedOneClickTrading
                        ? t('common.settings.one-click-modal.manage-delegate.status.active')
                        : t('common.settings.one-click-modal.manage-delegate.status.inactive')}
                    </div>
                  </div>
                  {delegateAddress && (
                    <div className={styles.infoLine}>
                      <div className={styles.infoTitle}>
                        {t('common.settings.one-click-modal.manage-delegate.address')}
                      </div>
                      <div className={styles.address}>{delegateAddress}</div>
                    </div>
                  )}
                  {delegateBalance && (
                    <div className={styles.infoLine}>
                      <div className={styles.infoTitle}>
                        {t('common.settings.one-click-modal.manage-delegate.amount')}
                      </div>
                      <div>{delegateBalance.formatted} ETH</div>
                    </div>
                  )}
                </div>
              ) : (
                <Typography variant="bodyMedium">
                  {t('common.settings.one-click-modal.create-delegate.description')}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box className={styles.dialogContent}>
          <Box className={styles.actionButtonsContainer}>
            {!isLoading && isDelegated === false && (
              <Button
                variant="primary"
                className={styles.actionButton}
                onClick={handleCreate}
                disabled={isActionLoading}
              >
                {t(`common.settings.one-click-modal.create-delegate.create`)}
              </Button>
            )}
            {!isLoading && isDelegated === true && (
              <>
                {activatedOneClickTrading ? (
                  <Button
                    variant="primary"
                    className={styles.actionButton}
                    onClick={() => setActivatedOneClickTrading(false)}
                    disabled={isActionLoading}
                  >
                    {t(`common.settings.one-click-modal.manage-delegate.deactivate`)}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className={styles.actionButton}
                    onClick={handleActivate}
                    disabled={isActionLoading}
                  >
                    {t(`common.settings.one-click-modal.manage-delegate.activate`)}
                  </Button>
                )}
                <Button
                  variant="primary"
                  className={styles.actionButton}
                  onClick={handleRemove}
                  disabled={isActionLoading}
                >
                  {t(`common.settings.one-click-modal.manage-delegate.remove`)}
                </Button>
                {activatedOneClickTrading && (
                  <Button
                    variant="primary"
                    className={styles.actionButton}
                    onClick={handleFund}
                    disabled={isActionLoading}
                  >
                    {t(`common.settings.one-click-modal.manage-delegate.fund`)}
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>
        <Separator />
        <Box className={styles.dialogContent}>
          <Box className={styles.closeButtonsContainer}>
            <Button variant="secondary" className={styles.cancelButton} onClick={onClose}>
              {t('common.info-modal.close')}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {activatedOneClickTrading && (
        <FundingModal
          isOpen={isFundingModalOpen}
          onClose={() => setFundingModalOpen(false)}
          delegateAddress={delegateAddress as Address}
        />
      )}
    </>
  );
};

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';

import { Box, Button, CircularProgress, Typography } from '@mui/material';

import { hasDelegate } from 'blockchain-api/contract-interactions/hasDelegate';
import { removeDelegate } from 'blockchain-api/contract-interactions/removeDelegate';
import { setDelegate } from 'blockchain-api/contract-interactions/setDelegate';
import { generateDelegate } from 'blockchain-api/generateDelegate';
import { getStorageKey } from 'blockchain-api/getStorageKey';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getDelegateKey } from 'helpers/getDelegateKey';
import { activatedOneClickTradingAtom, delegateAddressAtom, tradingClientAtom } from 'store/app.store';
import { oneClickModalOpenAtom } from 'store/global-modals.store';
import { storageKeyAtom } from 'store/order-block.store';
import { proxyAddrAtom, traderAPIAtom } from 'store/pools.store';

import { FundingModal } from '../funding-modal/FundingModal';

import styles from './OneClickTradingModal.module.scss';

const DELEGATE_INDEX = 1; // to be emitted with setDelegate

export const OneClickTradingModal = () => {
  const { t } = useTranslation();

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const [activatedOneClickTrading, setActivatedOneClickTrading] = useAtom(activatedOneClickTradingAtom);
  const [delegateAddress, setDelegateAddress] = useAtom(delegateAddressAtom);
  const [isOneClickModalOpen, setOneClickModalOpen] = useAtom(oneClickModalOpenAtom);
  const [storageKey, setStorageKey] = useAtom(storageKeyAtom);
  const proxyAddr = useAtomValue(proxyAddrAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const setTradingClient = useSetAtom(tradingClientAtom);

  const [isLoading, setLoading] = useState(false);
  const [isActionLoading, setActionLoading] = useState(false);
  const [isDelegated, setDelegated] = useState<boolean | null>(null);
  const [isFundingModalOpen, setFundingModalOpen] = useState(false);

  const handleRemoveRef = useRef(false);
  const handleActivateRef = useRef(false);
  const handleCreateRef = useRef(false);

  useEffect(() => {
    if (!address || !traderAPI || traderAPI?.chainId !== publicClient?.chain.id) {
      return;
    }

    setLoading(true);

    hasDelegate(publicClient, traderAPI.getProxyAddress() as Address, address)
      .then(setDelegated)
      .finally(() => setLoading(false));
  }, [publicClient, address, traderAPI]);

  useEffect(() => {
    if (!isDelegated || (address && address !== walletClient?.account?.address)) {
      setActivatedOneClickTrading(false);
      setDelegateAddress('');
    }
  }, [setActivatedOneClickTrading, setDelegateAddress, isDelegated, address, walletClient]);

  const handleCreate = async () => {
    if (!walletClient || !proxyAddr || !address || handleActivateRef.current) {
      return;
    }

    handleCreateRef.current = true;
    setActionLoading(true);

    const strgKey = await getStorageKey(walletClient);
    setStorageKey(strgKey);
    const delegateAddr = (await generateDelegate(walletClient, strgKey)).address;
    await setDelegate(walletClient, proxyAddr as Address, delegateAddr, DELEGATE_INDEX);
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
    if (
      !walletClient ||
      !address ||
      walletClient.account.address !== address ||
      !proxyAddr ||
      handleActivateRef.current
    ) {
      return;
    }

    handleActivateRef.current = true;
    setActionLoading(true);

    try {
      let strgKey = storageKey;
      if (!strgKey) {
        strgKey = await getStorageKey(walletClient);
        setStorageKey(strgKey);
      }
      const delegateKey = getDelegateKey(walletClient, strgKey);
      let generatedAddress;
      if (!delegateKey) {
        generatedAddress = (await generateDelegate(walletClient, strgKey)).address;
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

  const handleFund = async () => {
    setFundingModalOpen(true);
  };

  const { data: delegateBalance, refetch } = useBalance({
    address: delegateAddress as Address,
    query: { enabled: delegateAddress !== '' },
  });

  useEffect(() => {
    let interval: number | undefined;

    if (isOneClickModalOpen) {
      interval = window.setInterval(() => {
        refetch();
      }, 2000); // 2000 milliseconds = 5 seconds
    }

    return () => {
      if (interval !== undefined) {
        clearInterval(interval);
      }
    };
  }, [refetch, isOneClickModalOpen]);

  useEffect(() => {
    if (activatedOneClickTrading && delegateAddress !== '' && !!delegateBalance && delegateBalance.value < 10n) {
      setFundingModalOpen(true);
    }
  }, [activatedOneClickTrading, delegateBalance, delegateAddress]);

  const handleRemove = () => {
    if (!walletClient || !proxyAddr || handleRemoveRef.current) {
      return;
    }
    handleRemoveRef.current = true;
    setActionLoading(true);

    getStorageKey(walletClient)
      .then((strgKey) => generateDelegate(walletClient, strgKey))
      .then((delegateAccount) => removeDelegate(walletClient, delegateAccount, proxyAddr as Address))
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
  }, [address, walletClient, storageKey, activatedOneClickTrading, setTradingClient]);

  const handleClose = () => setOneClickModalOpen(false);

  return (
    <>
      <Dialog open={isOneClickModalOpen} onClose={handleClose}>
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
                      <div>
                        {delegateBalance.formatted} {delegateBalance?.symbol}
                      </div>
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
            <GasDepositChecker address={walletClient?.account.address} className={styles.actionButton}>
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
            </GasDepositChecker>
          </Box>
        </Box>
        <Separator />
        <Box className={styles.dialogContent}>
          <Box className={styles.closeButtonContainer}>
            <Button variant="secondary" className={styles.cancelButton} onClick={handleClose}>
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

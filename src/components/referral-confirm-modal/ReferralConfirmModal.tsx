import { useSetAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAccount, useWalletClient } from 'wagmi';

import { Button, DialogActions, DialogTitle, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { connectModalOpenAtom } from 'store/global-modals.store';
import { ToastContent } from 'components/toast-content/ToastContent';
import { WrongNetworkButton } from 'components/wallet-connect-button/WrongNetworkButton';
import { WalletConnectButton } from 'components/wallet-connect-button/WalletConnectButton';
import { web3AuthConfig } from 'config';
import { useQuery } from 'hooks/useQuery';
import { getCodeRebate, getMyCodeSelection, postUseReferralCode } from 'network/referral';
import { QueryParamE, ReferTabIdE } from 'pages/refer-page/constants';
import { RoutesE } from 'routes/RoutesE';
import { isEnabledChain } from 'utils/isEnabledChain';

import styles from './ReferralConfirmModal.module.scss';

const REF_ID_QUERY_PARAM = 'ref';

export const ReferralConfirmModal = memo(() => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const setConnectModalOpen = useSetAtom(connectModalOpenAtom);

  const [showModal, setShowModal] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [hasActiveCode, setHasActiveCode] = useState<boolean | null>(null);
  const [refIdTraderRebate, setRefIdTraderRebate] = useState<number | null>(0);

  const requestSentRef = useRef(false);
  const activeCodeRequestRef = useRef(false);
  const codeRebateRequestRef = useRef(false);

  const query = useQuery();
  const refId = query.get(REF_ID_QUERY_PARAM);

  const handleModalClose = () => {
    if (refId) {
      query.delete(REF_ID_QUERY_PARAM);

      const newQuery = query.toString();
      const paramsStr = newQuery ? `?${newQuery}` : '';
      navigate(`${location.pathname}${paramsStr}${location.hash}`, { replace: true });
    }
    setShowModal(false);
  };

  const handleReferralCodeConfirm = () => {
    if (
      requestSentRef.current ||
      !refId ||
      refIdTraderRebate === null ||
      !address ||
      !walletClient ||
      !isEnabledChain(chainId)
    ) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    postUseReferralCode(chainId, address, refId.toUpperCase(), walletClient, () => setShowModal(false))
      .then(() => {
        toast.success(<ToastContent title={t('pages.refer.toast.success-apply')} bodyLines={[]} />);
        navigate(`${RoutesE.Refer}?${QueryParamE.Tab}=${ReferTabIdE.Trader}`, { replace: true });
      })
      .catch((error) => {
        console.error(error);
        toast.error(<ToastContent title={error.error || error.message} bodyLines={[]} />);
      })
      .finally(() => {
        requestSentRef.current = false;
        setRequestSent(false);
      });
  };

  useEffect(() => {
    if (activeCodeRequestRef.current || !isEnabledChain(chainId) || !address || !refId) {
      return;
    }

    activeCodeRequestRef.current = true;

    getMyCodeSelection(chainId, address)
      .then(({ data }) => setHasActiveCode(data !== ''))
      .catch(console.error)
      .finally(() => {
        activeCodeRequestRef.current = false;
      });
  }, [refId, chainId, address]);

  useEffect(() => {
    if (codeRebateRequestRef.current || !isEnabledChain(chainId) || !refId) {
      return;
    }

    codeRebateRequestRef.current = true;
    getCodeRebate(chainId, refId)
      .then(({ data }) => {
        setRefIdTraderRebate(data.rebate_percent);
      })
      .catch(() => setRefIdTraderRebate(null))
      .finally(() => {
        codeRebateRequestRef.current = false;
      });
  }, [chainId, refId]);

  if (!refId) {
    return null;
  }

  const hasAddress = !!address;
  const hasReferralCode = hasActiveCode;
  const noReferralCode = hasActiveCode !== null && !hasActiveCode;
  const refIdIsValid = refIdTraderRebate !== null;

  return (
    <Dialog open={showModal} className={styles.dialog}>
      <DialogTitle>{t('pages.refer.use-code.title')}</DialogTitle>
      <div className={styles.dialogRoot}>
        <div className={styles.codeContainer}>
          <Typography variant="bodyMedium" fontWeight={600}>
            {t('pages.refer.use-code.base')}
          </Typography>
          <Typography variant="bodyMedium" fontWeight={600}>
            {refId}
          </Typography>
        </div>
        <div className={styles.paddedContainer}>
          {/*
          <SidesRow
            leftSide={t('pages.refer.use-code.trader-rebate')}
            rightSide={`${refIdTraderRebate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          */}
          {!hasAddress && <div className={styles.warning}>{t('pages.refer.use-code.connect-wallet')}</div>}
          {hasAddress && isEnabledChain(chainId) && hasReferralCode && (
            <div className={styles.warning}>{t('pages.refer.use-code.already-linked')}</div>
          )}
          {hasAddress && isEnabledChain(chainId) && noReferralCode && !refIdIsValid && (
            <div className={styles.warning}>{t('pages.refer.trader-tab.code-not-found')}</div>
          )}
        </div>
      </div>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={handleModalClose} variant="secondary">
          {t('pages.refer.use-code.cancel')}
        </Button>
        {!hasAddress && (
          <>
            {web3AuthConfig.isEnabled ? (
              <Button onClick={() => setConnectModalOpen(true)} className={styles.connectButton} variant="primary">
                <span className={styles.modalButtonText}>{t('common.wallet-connect')}</span>
              </Button>
            ) : (
              <WalletConnectButton className={styles.connectButton} />
            )}
          </>
        )}
        {hasAddress && !isEnabledChain(chainId) && <WrongNetworkButton className={styles.connectButton} />}
        {hasAddress && isEnabledChain(chainId) && noReferralCode && (
          <Button
            onClick={handleReferralCodeConfirm}
            variant="primary"
            size="small"
            disabled={requestSent || !refIdIsValid}
          >
            {t('pages.refer.use-code.confirm')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

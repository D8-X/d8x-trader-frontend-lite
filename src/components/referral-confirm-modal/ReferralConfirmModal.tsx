import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Box, Button, DialogActions, DialogTitle, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useQuery } from 'hooks/useQuery';
import { getCodeRebate, getMyCodeSelection, postUseReferralCode } from 'network/referral';
import { QueryParamE, ReferTabIdE } from 'pages/refer-page/constants';
import { RoutesE } from 'routes/RoutesE';

import { WalletConnectButton } from '../wallet-connect-button/WalletConnectButton';

import styles from './ReferralConfirmModal.module.scss';

const REF_ID_QUERY_PARAM = 'ref';

export const ReferralConfirmModal = memo(() => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

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

  const handleReferralCodeConfirm = async () => {
    if (requestSentRef.current || !refId || refIdTraderRebate === null || !address || !walletClient) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    try {
      await postUseReferralCode(chainId, address, refId.toUpperCase(), walletClient, () => setShowModal(false));
      requestSentRef.current = false;
      setRequestSent(false);
      toast.success(<ToastContent title={t('pages.refer.toast.success-apply')} bodyLines={[]} />);
      navigate(`${RoutesE.Refer}?${QueryParamE.Tab}=${ReferTabIdE.Trader}`, { replace: true });
    } catch (err) {
      requestSentRef.current = false;
      setRequestSent(false);
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeCodeRequestRef.current || !chainId || !address || !refId) {
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
    if (codeRebateRequestRef.current || !chainId || !refId) {
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
      <Box className={styles.dialogRoot}>
        <Box className={styles.codeContainer}>
          <Typography variant="bodyMedium" fontWeight={600}>
            {t('pages.refer.use-code.base')}
          </Typography>
          <Typography variant="bodyMedium" fontWeight={600}>
            {refId}
          </Typography>
        </Box>
        <Box className={styles.paddedContainer}>
          {/*
          <SidesRow
            leftSide={t('pages.refer.use-code.trader-rebate')}
            rightSide={`${refIdTraderRebate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          */}
          {!hasAddress && <Box className={styles.warning}>{t('pages.refer.use-code.connect-wallet')}</Box>}
          {hasAddress && hasReferralCode && (
            <Box className={styles.warning}>{t('pages.refer.use-code.already-linked')}</Box>
          )}
          {hasAddress && noReferralCode && !refIdIsValid && (
            <Box className={styles.warning}>{t('pages.refer.trader-tab.code-not-found')}</Box>
          )}
        </Box>
      </Box>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={handleModalClose} variant="secondary" size="small">
          {t('pages.refer.use-code.cancel')}
        </Button>
        {!hasAddress && <WalletConnectButton buttonClassName={styles.walletButton} />}
        {hasAddress && noReferralCode && (
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

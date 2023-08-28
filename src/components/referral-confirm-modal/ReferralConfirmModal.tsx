import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Box, Button, DialogActions, DialogTitle, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
// import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useQuery } from 'hooks/useQuery';
import { useReferralCodes } from 'hooks/useReferralCodes';
import { getReferralCodeExists, postUseReferralCode } from 'network/referral';
import { QueryParamE, ReferTabIdE } from 'pages/refer-page/constants';
import { PageE } from 'types/enums';

import styles from './ReferralConfirmModal.module.scss';
import { WalletConnectButton } from '../wallet-connect-button/WalletConnectButton';

const REF_ID_QUERY_PARAM = 'ref';

export const ReferralConfirmModal = memo(() => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const [showModal, setShowModal] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [refIdTraderRebate, setRefIdTraderRebate] = useState<number | null>(0);

  const requestSentRef = useRef(false);

  const query = useQuery();

  const { referralCode } = useReferralCodes(address, chainId);

  const refId = query.get(REF_ID_QUERY_PARAM);

  const handleModalClose = useCallback(() => {
    if (refId) {
      query.delete(REF_ID_QUERY_PARAM);

      const newQuery = query.toString();
      const paramsStr = newQuery ? `?${newQuery}` : '';
      navigate(`${location.pathname}${paramsStr}${location.hash}`, { replace: true });
    }
    setShowModal(false);
  }, [query, refId, location, navigate]);

  const onCodeApplySuccess = useCallback(() => {
    navigate(`${PageE.Refer}?${QueryParamE.Tab}=${ReferTabIdE.Trader}`, { replace: true });
  }, [navigate]);

  const handleReferralCodeConfirm = useCallback(async () => {
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
      onCodeApplySuccess();
    } catch (err) {
      requestSentRef.current = false;
      setRequestSent(false);
      console.error(err);
    }
  }, [refId, refIdTraderRebate, chainId, address, walletClient, onCodeApplySuccess, t]);

  useEffect(() => {
    if (chainId && refId) {
      getReferralCodeExists(chainId, refId).then((response) => {
        setRefIdTraderRebate(response.data.length ? response.data[0].traderRebatePerc : null);
      });
    }
  }, [chainId, refId]);

  if (!refId) {
    return null;
  }

  const hasAddress = !!address;
  const hasReferralCode = referralCode !== '' && referralCode !== null;
  const noReferralCode = referralCode === '';
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

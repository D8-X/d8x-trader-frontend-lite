import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, CircularProgress, Typography } from '@mui/material';

import { settleTrader } from 'blockchain-api/contract-interactions/settleTrader';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import { proxyAddrAtom, traderAPIAtom } from 'store/pools.store';
import type { MarginAccountWithAdditionalDataI, PoolWithIdI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

import { useSettleTokenBalance } from '../../../hooks/useSettleTokenBalance';

import { useSendTransaction } from '@privy-io/react-auth';
import { smartAccountClientAtom } from 'store/app.store';
import modalStyles from '../Modal.module.scss';

interface ClaimModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountWithAdditionalDataI | null;
  poolByPosition?: PoolWithIdI | null;
  closeModal: () => void;
}

export const ClaimModal = memo(({ isOpen, selectedPosition, poolByPosition, closeModal }: ClaimModalPropsI) => {
  const { t } = useTranslation();

  const proxyAddr = useAtomValue(proxyAddrAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const smartAccountClient = useAtomValue(smartAccountClientAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);

  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: chain?.id });
  const { sendTransaction } = useSendTransaction();

  const { settleTokenDecimals } = useSettleTokenBalance({ poolByPosition });

  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<Address>();
  const [symbolForTx, setSymbolForTx] = useState('');
  const [loading, setLoading] = useState(false);

  const requestSentRef = useRef(false);

  const {
    isSuccess,
    isError,
    isFetched,
    error: reason,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!txHash },
  });

  useEffect(() => {
    if (!isFetched || !txHash) {
      return;
    }
    setTxHash(undefined);
    setSymbolForTx('');
    setLatestOrderSentTimestamp(Date.now());
    setLoading(false);
  }, [isFetched, txHash, setLatestOrderSentTimestamp]);

  useEffect(() => {
    if (!isError || !reason) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('pages.trade.positions-table.toasts.tx-failed.title')}
        bodyLines={[{ label: t('pages.trade.positions-table.toasts.tx-failed.body'), value: reason.message }]}
      />
    );
  }, [isError, reason, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    toast.success(
      <ToastContent
        title={t('pages.trade.positions-table.toasts.submitted.title')}
        bodyLines={[
          {
            label: t('pages.trade.positions-table.toasts.submitted.body'),
            value: symbolForTx,
          },
          {
            label: '',
            value: (
              <a
                href={getTxnLink(chain?.blockExplorers?.default?.url, txHash)}
                target="_blank"
                rel="noreferrer"
                className={modalStyles.shareLink}
              >
                {txHash}
              </a>
            ),
          },
        ]}
      />
    );
    closeModal();
  }, [isSuccess, txHash, chain, symbolForTx, closeModal, t]);

  const handleClaimPositionConfirm = async () => {
    if (requestSentRef.current) {
      return;
    }

    if (
      !selectedPosition ||
      !address ||
      !poolByPosition ||
      !proxyAddr ||
      !walletClient ||
      !smartAccountClient ||
      !settleTokenDecimals ||
      !chain ||
      !traderAPI ||
      !isEnabledChain(chain?.id)
    ) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);
    setLoading(true);

    settleTrader(sendTransaction, traderAPI, selectedPosition.symbol, address)
      .then(({ hash }) => {
        setTxHash(hash);
        setSymbolForTx(selectedPosition.symbol);
        toast.success(
          <ToastContent title={t('pages.trade.positions-table.toasts.submit-claim.title')} bodyLines={[]} />
        );
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
        let msg = (error?.message ?? error) as string;
        msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
        toast.error(
          <ToastContent
            title={t('pages.trade.positions-table.toasts.error-processing.title')}
            bodyLines={[{ label: t('pages.trade.positions-table.toasts.error-processing.body'), value: msg }]}
          />
        );
      })
      .finally(() => {
        setRequestSent(false);
        requestSentRef.current = false;
      });
  };

  if (!selectedPosition) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      onCloseClick={closeModal}
      className={modalStyles.root}
      dialogTitle={t('pages.trade.positions-table.modify-modal.claim')}
      footerActions={
        <>
          <Button onClick={closeModal} variant="secondary" size="small">
            {t('pages.trade.positions-table.modify-modal.cancel')}
          </Button>
          <GasDepositChecker multiplier={1n}>
            <Button
              onClick={handleClaimPositionConfirm}
              variant="primary"
              size="small"
              disabled={loading || requestSent}
            >
              {loading && <CircularProgress size="24px" sx={{ mr: 2 }} />}
              {t('pages.trade.positions-table.modify-modal.confirm')}
            </Button>
          </GasDepositChecker>
        </>
      }
    >
      <div className={modalStyles.newPositionHeader}>
        <Typography variant="bodySmall">{t('pages.trade.positions-table.modify-modal.claim-details')}</Typography>
      </div>
    </Dialog>
  );
});

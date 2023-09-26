import { useAtom, useSetAtom } from 'jotai';
import { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address, useAccount, useChainId, useWaitForTransaction, useWalletClient } from 'wagmi';

import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { HashZero } from 'app-constants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { orderDigest } from 'network/network';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import { poolTokenDecimalsAtom, proxyAddrAtom, selectedPoolAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';
import { type MarginAccountI, type OrderI } from 'types/types';

import styles from '../Modal.module.scss';

interface CloseModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountI | null;
  closeModal: () => void;
}

export const CloseModal = memo(({ isOpen, selectedPosition, closeModal }: CloseModalPropsI) => {
  const { t } = useTranslation();

  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [poolTokenDecimals] = useAtom(poolTokenDecimalsAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);

  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: chainId });

  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);
  const [symbolForTx, setSymbolForTx] = useState('');

  const requestSentRef = useRef(false);

  useWaitForTransaction({
    hash: txHash,
    onSuccess() {
      toast.success(
        <ToastContent
          title={t('pages.trade.positions-table.toasts.submitted.title')}
          bodyLines={[
            {
              label: t('pages.trade.positions-table.toasts.submitted.body'),
              value: symbolForTx,
            },
          ]}
        />
      );
    },
    onError(reason) {
      toast.error(
        <ToastContent
          title={t('pages.trade.positions-table.toasts.tx-failed.title')}
          bodyLines={[{ label: t('pages.trade.positions-table.toasts.tx-failed.body'), value: reason.message }]}
        />
      );
    },
    onSettled() {
      setTxHash(undefined);
      setSymbolForTx('');
      setLatestOrderSentTimestamp(Date.now());
    },
    enabled: !!address && !!txHash,
  });

  const handleClosePositionConfirm = () => {
    if (requestSentRef.current) {
      return;
    }

    if (!selectedPosition || !address || !selectedPool || !proxyAddr || !walletClient || !poolTokenDecimals) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    const closeOrder: OrderI = {
      symbol: selectedPosition.symbol,
      side: selectedPosition.side === 'BUY' ? 'SELL' : 'BUY',
      type: OrderTypeE.Market.toUpperCase(),
      quantity: selectedPosition.positionNotionalBaseCCY,
      executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      reduceOnly: true,
      leverage: selectedPosition.leverage,
    };

    orderDigest(chainId, [closeOrder], address)
      .then((data) => {
        if (data.data.digests.length > 0) {
          approveMarginToken(walletClient, selectedPool.marginTokenAddr, proxyAddr, 0, poolTokenDecimals).then(() => {
            const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
            postOrder(walletClient, signatures, data.data)
              .then((tx) => {
                setTxHash(tx.hash);
                setSymbolForTx(selectedPosition.symbol);
                console.log(`postOrder tx hash: ${tx.hash}`);
                toast.success(
                  <ToastContent title={t('pages.trade.positions-table.toasts.submit-close.title')} bodyLines={[]} />
                );
              })
              .catch((error) => {
                console.error(error);
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
                closeModal();
              });
          });
        }
      })
      .catch((error) => {
        console.error(error);
        setRequestSent(false);
        requestSentRef.current = false;
      });
  };

  return (
    <Dialog open={isOpen} className={styles.root}>
      <DialogTitle>{t('pages.trade.positions-table.modify-modal.close')}</DialogTitle>
      <Separator />
      <DialogContent>
        <Box className={styles.newPositionHeader}>
          <Typography variant="bodyMedium" className={styles.centered}>
            {t('pages.trade.positions-table.modify-modal.pos-details.title')}
          </Typography>
        </Box>
        <Box className={styles.newPositionDetails}>
          <SidesRow leftSide={t('pages.trade.positions-table.modify-modal.pos-details.size')} rightSide={0} />
          <SidesRow leftSide={t('pages.trade.positions-table.modify-modal.pos-details.margin')} rightSide={0} />
          <SidesRow leftSide={t('pages.trade.positions-table.modify-modal.pos-details.leverage')} rightSide="-" />
          <SidesRow leftSide={t('pages.trade.positions-table.modify-modal.pos-details.liq-price')} rightSide="-" />
        </Box>
      </DialogContent>
      <Separator />
      <DialogActions>
        <Button onClick={closeModal} variant="secondary" size="small">
          {t('pages.trade.positions-table.modify-modal.cancel')}
        </Button>
        <Button onClick={handleClosePositionConfirm} variant="primary" size="small" disabled={requestSent}>
          {t('pages.trade.positions-table.modify-modal.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { type Address } from 'viem';

import { Box, Button, Checkbox, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { HashZero } from 'appConstants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { Separator } from 'components/separator/Separator';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { orderDigest } from 'network/network';
import { parseSymbol } from 'helpers/parseSymbol';
import { orderSubmitted } from 'network/broker';
import { tradingClientAtom } from 'store/app.store';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import { proxyAddrAtom, traderAPIAtom } from 'store/pools.store';
import { OrderSideE, OrderTypeE } from 'types/enums';
import type { MarginAccountWithAdditionalDataI, OrderI, OrderWithIdI, PoolWithIdI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { cancelOrders } from '../../../helpers/cancelOrders';
import { usePoolTokenBalance } from '../../../hooks/usePoolTokenBalance';

import modalStyles from '../Modal.module.scss';
import styles from './CloseModal.module.scss';

interface CloseModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountWithAdditionalDataI | null;
  poolByPosition?: PoolWithIdI | null;
  closeModal: () => void;
}

export const CloseModal = memo(({ isOpen, selectedPosition, poolByPosition, closeModal }: CloseModalPropsI) => {
  const { t } = useTranslation();

  const proxyAddr = useAtomValue(proxyAddrAtom);
  const tradingClient = useAtomValue(tradingClientAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);

  const chainId = useChainId();
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: chainId });

  const { poolTokenDecimals } = usePoolTokenBalance({ poolByPosition });

  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);
  const [symbolForTx, setSymbolForTx] = useState('');
  const [closeOpenOrders, setCloseOpenOrders] = useState(true);

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
  }, [isSuccess, txHash, chain, symbolForTx, t]);

  const handleClosePositionConfirm = async () => {
    if (requestSentRef.current) {
      return;
    }

    if (
      !selectedPosition ||
      !address ||
      !poolByPosition ||
      !proxyAddr ||
      !walletClient ||
      !tradingClient ||
      !poolTokenDecimals
    ) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    const closeOrder: OrderI = {
      symbol: selectedPosition.symbol,
      side: selectedPosition.side === OrderSideE.Buy ? OrderSideE.Sell : OrderSideE.Buy,
      type: OrderTypeE.Market.toUpperCase(),
      quantity: selectedPosition.positionNotionalBaseCCY,
      executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      reduceOnly: true,
      leverage: selectedPosition.leverage,
    };

    orderDigest(chainId, [closeOrder], address)
      .then((data) => {
        if (data.data.digests.length > 0) {
          approveMarginToken(walletClient, poolByPosition.marginTokenAddr, proxyAddr, 0, poolTokenDecimals).then(() => {
            const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
            postOrder(tradingClient, signatures, data.data)
              .then((tx) => {
                setTxHash(tx.hash);
                setSymbolForTx(selectedPosition.symbol);
                orderSubmitted(walletClient.chain.id, data.data.orderIds).then().catch(console.error);
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

    if (closeOpenOrders) {
      const ordersToCancel: OrderWithIdI[] = [];
      if (selectedPosition.takeProfit.orders.length > 0) {
        ordersToCancel.push(...selectedPosition.takeProfit.orders);
      }
      if (selectedPosition.stopLoss.orders.length > 0) {
        ordersToCancel.push(...selectedPosition.stopLoss.orders);
      }

      await cancelOrders({
        ordersToCancel,
        chainId,
        chain,
        traderAPI,
        tradingClient,
        toastTitle: t('pages.trade.orders-table.toasts.cancel-order.title'),
        nonceShift: 1,
        callback: () => {
          setLatestOrderSentTimestamp(Date.now());
        },
      });
    }
  };

  useEffect(() => {
    setCloseOpenOrders(true);
  }, [selectedPosition]);

  const hasTpSl =
    selectedPosition && (selectedPosition.stopLoss.orders.length > 0 || selectedPosition.takeProfit.orders.length > 0);

  const parsedSymbol = parseSymbol(selectedPosition?.symbol);

  return (
    <Dialog open={isOpen} className={modalStyles.root}>
      <DialogTitle>{t('pages.trade.positions-table.modify-modal.close')}</DialogTitle>
      <Separator />
      <DialogContent>
        <Box className={modalStyles.newPositionHeader}>
          <Typography variant="bodyMedium" className={modalStyles.centered}>
            {t('pages.trade.positions-table.modify-modal.pos-details.title-existing')}
          </Typography>
        </Box>
        <Box className={modalStyles.newPositionDetails}>
          <SidesRow
            leftSide={t('pages.trade.positions-table.modify-modal.pos-details.size')}
            rightSide={formatToCurrency(selectedPosition?.positionNotionalBaseCCY, parsedSymbol?.baseCurrency, true)}
          />
          <SidesRow
            leftSide={t('pages.trade.positions-table.modify-modal.pos-details.side')}
            rightSide={
              selectedPosition?.side === 'BUY'
                ? t('pages.trade.positions-table.table-content.buy')
                : t('pages.trade.positions-table.table-content.sell')
            }
          />
          <SidesRow
            leftSide={t('pages.trade.positions-table.modify-modal.pos-details.liq-price')}
            rightSide={
              !selectedPosition || selectedPosition.liqPrice < 0
                ? `- ${parsedSymbol?.quoteCurrency}`
                : formatToCurrency(selectedPosition.liqPrice, parsedSymbol?.quoteCurrency, true)
            }
          />
          <SidesRow
            leftSide={t('pages.trade.positions-table.modify-modal.pos-details.margin')}
            rightSide={`${formatToCurrency(selectedPosition?.collateralCC, parsedSymbol?.poolSymbol, true)}${
              selectedPosition && ` (${Math.round(selectedPosition?.leverage * 100) / 100}x)`
            }`}
          />
          <SidesRow
            leftSide={t('pages.trade.positions-table.modify-modal.pos-details.unrealized')}
            rightSide={formatToCurrency(selectedPosition?.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency, true)}
            rightSideStyles={
              selectedPosition && selectedPosition.unrealizedPnlQuoteCCY > 0 ? styles.pnlPositive : styles.pnlNegative
            }
          />
        </Box>
      </DialogContent>
      {hasTpSl && (
        <>
          <Separator />
          <DialogContent>
            <Box className={modalStyles.actionBlock} onClick={() => setCloseOpenOrders((prev) => !prev)}>
              <SidesRow
                leftSide={t('pages.trade.positions-table.modify-modal.pos-details.close-tp-sl')}
                rightSide={<Checkbox checked={closeOpenOrders} className={modalStyles.checkbox} />}
              />
            </Box>
          </DialogContent>
        </>
      )}
      <Separator />
      <DialogActions>
        <Button onClick={closeModal} variant="secondary" size="small">
          {t('pages.trade.positions-table.modify-modal.cancel')}
        </Button>
        <GasDepositChecker>
          <Button onClick={handleClosePositionConfirm} variant="primary" size="small" disabled={requestSent}>
            {t('pages.trade.positions-table.modify-modal.confirm')}
          </Button>
        </GasDepositChecker>
      </DialogActions>
    </Dialog>
  );
});

import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, Checkbox, CircularProgress, Typography } from '@mui/material';

import { HashZero } from 'appConstants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { SeparatorTypeE } from 'components/separator/enums';
import { Separator } from 'components/separator/Separator';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { getTxnLink } from 'helpers/getTxnLink';
import { orderDigest, positionRiskOnTrade } from 'network/network';
import { parseSymbol } from 'helpers/parseSymbol';
import { orderSubmitted } from 'network/broker';
import { tradingClientAtom } from 'store/app.store';
import { orderInfoAtom, latestOrderSentTimestampAtom } from 'store/order-block.store';
import {
  collateralToSettleConversionAtom,
  poolFeeAtom,
  proxyAddrAtom,
  traderAPIAtom,
  flatTokenAtom,
} from 'store/pools.store';
import { OrderSideE, OrderTypeE } from 'types/enums';
import type { MarginAccountWithAdditionalDataI, OrderI, OrderWithIdI, PoolWithIdI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';
import { isEnabledChain } from 'utils/isEnabledChain';

import { cancelOrders } from '../../../helpers/cancelOrders';
import { useSettleTokenBalance } from '../../../hooks/useSettleTokenBalance';

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
  const c2s = useAtomValue(collateralToSettleConversionAtom);
  const flatToken = useAtomValue(flatTokenAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);

  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: chain?.id });

  const { isMultisigAddress } = useUserWallet();
  const { settleTokenDecimals } = useSettleTokenBalance({ poolByPosition });
  const orderInfo = useAtomValue(orderInfoAtom);
  const poolFee = useAtomValue(poolFeeAtom);

  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<Address>();
  const [symbolForTx, setSymbolForTx] = useState('');
  const [closeOpenOrders, setCloseOpenOrders] = useState(true);
  const [loading, setLoading] = useState(false);
  const [estimatedPnL, setEstimatedPnL] = useState<number | null>(null);

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
    if (!selectedPosition) return;

    const closeOrderReview: OrderI = {
      symbol: selectedPosition.symbol,
      side: selectedPosition.side === OrderSideE.Buy ? OrderSideE.Sell : OrderSideE.Buy,
      type: OrderTypeE.Market.toUpperCase(),
      quantity: selectedPosition.positionNotionalBaseCCY,
      leverage: 0,
      reduceOnly: true,
      executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      deadline: Math.floor(Date.now() / 1000 + 60 * 60 * 24),
    };

    if (chain?.id && traderAPI && address && orderInfo && poolFee) {
      let isPredictionMarket = false;
      try {
        isPredictionMarket = traderAPI?.isPredictionMarket(selectedPosition.symbol);
      } catch {
        // skip
      }

      positionRiskOnTrade(
        chain?.id,
        traderAPI,
        closeOrderReview,
        address,
        (selectedPosition?.positionNotionalBaseCCY ?? 0) * (selectedPosition?.side === OrderSideE.Buy ? 1 : -1),
        isPredictionMarket && orderInfo.tradingFee ? orderInfo.tradingFee * 1e5 : poolFee
      )
        .then((data) => {
          const estimPnL =
            (data.data.ammPrice - selectedPosition.markPrice) *
              (selectedPosition?.side === OrderSideE.Buy ? 1 : -1) *
              selectedPosition.positionNotionalBaseCCY +
            selectedPosition.unrealizedPnlQuoteCCY;
          setEstimatedPnL(estimPnL / data.data.newPositionRisk.collToQuoteConversion); // in cc
        })
        .catch((error) => {
          console.error('Error calculating PnL:', error);
          setEstimatedPnL(null);
        });
    }
  }, [chain?.id, traderAPI, address, orderInfo, poolFee, selectedPosition]);

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

    const closeOrder: OrderI = {
      symbol: selectedPosition.symbol,
      side: selectedPosition.side === OrderSideE.Buy ? OrderSideE.Sell : OrderSideE.Buy,
      type: OrderTypeE.Market.toUpperCase(),
      quantity: selectedPosition.positionNotionalBaseCCY,
      leverage: 0,
      reduceOnly: true,
      executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      deadline: Math.floor(Date.now() / 1000 + 60 * 60 * 24),
    };

    orderDigest(chain.id, [closeOrder], address)
      .then((data) => {
        if (data.data.digests.length > 0) {
          approveMarginToken({
            walletClient,
            settleTokenAddr: poolByPosition.settleTokenAddr,
            isMultisigAddress,
            proxyAddr,
            minAmount: 0,
            decimals: settleTokenDecimals,
            registeredToken: flatToken?.registeredToken,
          }).then(() => {
            const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
            postOrder(tradingClient, traderAPI, {
              traderAddr: address,
              orders: [closeOrder],
              signatures,
              brokerData: data.data,
            })
              .then(({ hash }) => {
                setTxHash(hash);
                setSymbolForTx(selectedPosition.symbol.split('-').slice(0, -1).join('-'));
                orderSubmitted(walletClient.chain.id, data.data.orderIds).then().catch(console.error);
                toast.success(
                  <ToastContent title={t('pages.trade.positions-table.toasts.submit-close.title')} bodyLines={[]} />
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
          });
        }
      })
      .catch((error) => {
        console.error(error);
        setRequestSent(false);
        requestSentRef.current = false;
        setLoading(false);
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
        chain,
        isMultisigAddress,
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

  if (!selectedPosition) {
    return null;
  }

  const hasTpSl =
    selectedPosition && (selectedPosition.stopLoss.orders.length > 0 || selectedPosition.takeProfit.orders.length > 0);

  const parsedSymbol = parseSymbol(selectedPosition?.symbol);

  const [userPrice, userSymbol] =
    !!flatToken && poolByPosition?.poolId === flatToken.poolId && !!flatToken.registeredSymbol
      ? [flatToken.compositePrice ?? 1, flatToken.registeredSymbol]
      : [1, poolByPosition?.settleSymbol ?? ''];

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      onCloseClick={closeModal}
      className={modalStyles.root}
      dialogTitle={t('pages.trade.positions-table.modify-modal.close')}
      footerActions={
        <>
          <Button onClick={closeModal} variant="secondary" size="small">
            {t('pages.trade.positions-table.modify-modal.cancel')}
          </Button>
          <GasDepositChecker multiplier={3n}>
            <Button
              onClick={handleClosePositionConfirm}
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
        <Typography variant="bodyMedium" className={modalStyles.centered}>
          {t('pages.trade.positions-table.modify-modal.pos-details.title-existing')}
        </Typography>
      </div>
      <div className={modalStyles.newPositionDetails}>
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
          rightSide={`${
            poolByPosition
              ? formatToCurrency(
                  selectedPosition.collateralCC * (c2s.get(poolByPosition.poolSymbol)?.value ?? 1) * userPrice,
                  userSymbol,
                  true
                )
              : '-'
          }${selectedPosition && ` (${Math.round(selectedPosition.leverage * 100) / 100}x)`}`}
        />
        <SidesRow
          leftSide={t('pages.trade.positions-table.modify-modal.pos-details.unrealized')}
          rightSide={estimatedPnL !== null ? formatToCurrency(estimatedPnL * userPrice, userSymbol, true) : '-'}
          rightSideStyles={estimatedPnL === null || estimatedPnL > 0 ? styles.pnlPositive : styles.pnlNegative}
        />
      </div>
      {hasTpSl && (
        <>
          <Separator separatorType={SeparatorTypeE.Modal} />
          <div className={modalStyles.actionBlock} onClick={() => setCloseOpenOrders((prev) => !prev)}>
            <SidesRow
              leftSide={t('pages.trade.positions-table.modify-modal.pos-details.close-tp-sl')}
              rightSide={<Checkbox checked={closeOpenOrders} className={modalStyles.checkbox} />}
            />
          </div>
        </>
      )}
    </Dialog>
  );
});

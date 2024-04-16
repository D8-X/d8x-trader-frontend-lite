import classnames from 'classnames';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useChainId, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, CircularProgress, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { HashZero, SECONDARY_DEADLINE_MULTIPLIER } from 'appConstants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { parseSymbol } from 'helpers/parseSymbol';
import { getTradingFee, orderDigest, positionRiskOnTrade } from 'network/network';
import { tradingClientAtom } from 'store/app.store';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import { proxyAddrAtom, traderAPIAtom } from 'store/pools.store';
import { OpenOrderTypeE, OrderSideE, OrderTypeE } from 'types/enums';
import type { MarginAccountWithAdditionalDataI, OrderI, OrderWithIdI, PoolWithIdI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { cancelOrders } from '../../../helpers/cancelOrders';
import { usePoolTokenBalance } from '../../../hooks/usePoolTokenBalance';
import { StopLossSelector } from './components/StopLossSelector';
import { TakeProfitSelector } from './components/TakeProfitSelector';

import styles from '../Modal.module.scss';

interface ModifyModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountWithAdditionalDataI | null;
  poolByPosition?: PoolWithIdI | null;
  closeModal: () => void;
}

function createMainOrder(position: MarginAccountWithAdditionalDataI) {
  const deadlineMultiplier = 200; // By default, is it set to 200 hours

  return {
    symbol: position.symbol,
    side: position.side,
    type: OrderTypeE.Market,
    // limitPrice: undefined,
    // stopPrice: undefined,
    quantity: position.positionNotionalBaseCCY,
    leverage: position.leverage,
    reduceOnly: true,
    // keepPositionLvg: undefined,
    executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
    deadline: Math.floor(Date.now() / 1000 + 60 * 60 * deadlineMultiplier),
  };
}

export const ModifyTpSlModal = memo(({ isOpen, selectedPosition, poolByPosition, closeModal }: ModifyModalPropsI) => {
  const { t } = useTranslation();

  const { address, chain } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient({
    chainId,
  });

  const proxyAddr = useAtomValue(proxyAddrAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const tradingClient = useAtomValue(tradingClientAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);

  const [collateralDeposit, setCollateralDeposit] = useState<number | null>(null);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | null | undefined>(undefined);
  const [stopLossPrice, setStopLossPrice] = useState<number | null | undefined>(undefined);
  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<Address>();
  const [poolFee, setPoolFee] = useState<number>();
  const [loading, setLoading] = useState(false);

  const validityCheckRef = useRef(false);
  const requestSentRef = useRef(false);
  const fetchFeeRef = useRef(false);

  const { poolTokenDecimals } = usePoolTokenBalance({ poolByPosition });

  useEffect(() => {
    if (validityCheckRef.current) {
      return;
    }

    if (!selectedPosition || !address || !traderAPI || !poolFee) {
      return;
    }

    validityCheckRef.current = true;

    const mainOrder = createMainOrder(selectedPosition);
    positionRiskOnTrade(chainId, traderAPI, mainOrder, address, selectedPosition, poolFee)
      .then((data) => {
        setCollateralDeposit(data.data.orderCost);
      })
      .catch(console.error)
      .finally(() => {
        validityCheckRef.current = false;
      });
  }, [selectedPosition, address, traderAPI, chainId, poolFee]);

  const fetchPoolFee = useCallback((_chainId: number, _poolSymbol: string, _address: Address) => {
    if (fetchFeeRef.current) {
      return;
    }

    fetchFeeRef.current = true;

    getTradingFee(_chainId, _poolSymbol, _address)
      .then((data) => {
        setPoolFee(data.data);
      })
      .catch(console.error)
      .finally(() => {
        fetchFeeRef.current = false;
      });
  }, []);

  useEffect(() => {
    if (!chainId || !poolByPosition?.poolSymbol || !address) {
      return;
    }
    fetchPoolFee(chainId, poolByPosition.poolSymbol, address);
  }, [chainId, poolByPosition?.poolSymbol, address, fetchPoolFee]);

  const { isSuccess, isError, isFetched } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!selectedPosition?.symbol && !!txHash },
  });

  useEffect(() => {
    if (!isFetched) {
      return;
    }
    setTxHash(undefined);
    setLoading(false);
  }, [isFetched, setLatestOrderSentTimestamp]);

  useEffect(() => {
    if (!isError) {
      return;
    }
    toast.error(<ToastContent title={t('pages.trade.action-block.toasts.error.title')} bodyLines={[]} />);
  }, [isError, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    setLatestOrderSentTimestamp(Date.now());
    toast.success(
      <ToastContent
        title={t('pages.trade.action-block.toasts.order-submitted.title')}
        bodyLines={[
          {
            label: t('pages.trade.action-block.toasts.order-submitted.body'),
            value: selectedPosition?.symbol,
          },
          {
            label: '',
            value: (
              <a
                href={getTxnLink(chain?.blockExplorers?.default?.url, txHash)}
                target="_blank"
                rel="noreferrer"
                className={styles.shareLink}
              >
                {txHash}
              </a>
            ),
          },
        ]}
      />
    );
    closeModal();
  }, [isSuccess, txHash, chain, selectedPosition?.symbol, setLatestOrderSentTimestamp, closeModal, t]);

  if (!selectedPosition) {
    return null;
  }

  const parsedSymbol = parseSymbol(selectedPosition.symbol);

  const handleModifyPositionConfirm = async () => {
    if (
      !poolByPosition ||
      !selectedPosition ||
      requestSentRef.current ||
      !tradingClient ||
      !address ||
      !proxyAddr ||
      !walletClient ||
      collateralDeposit === null ||
      !poolTokenDecimals
    ) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);
    setLoading(true);

    const ordersToCancel: OrderWithIdI[] = [];
    if (takeProfitPrice !== selectedPosition.takeProfit.fullValue && selectedPosition.takeProfit.orders.length > 0) {
      ordersToCancel.push(...selectedPosition.takeProfit.orders);
    }
    if (stopLossPrice !== selectedPosition.stopLoss.fullValue && selectedPosition.stopLoss.orders.length > 0) {
      ordersToCancel.push(...selectedPosition.stopLoss.orders);
    }

    await cancelOrders({
      ordersToCancel,
      chainId,
      chain,
      traderAPI,
      tradingClient,
      toastTitle: t('pages.trade.orders-table.toasts.cancel-order.title'),
      nonceShift: 0,
      callback: () => {
        setLatestOrderSentTimestamp(Date.now());
      },
    });

    const parsedOrders: OrderI[] = [];
    if (takeProfitPrice != null && takeProfitPrice !== selectedPosition.takeProfit.fullValue) {
      parsedOrders.push({
        // Changed values comparing to main Order
        side: selectedPosition.side === OrderSideE.Buy ? OrderSideE.Sell : OrderSideE.Buy,
        type: OpenOrderTypeE.Limit,
        limitPrice: takeProfitPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: selectedPosition.symbol,
        quantity: selectedPosition.positionNotionalBaseCCY,
        leverage: selectedPosition.leverage,
        reduceOnly: true,
        // keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      });
    }

    if (stopLossPrice != null && stopLossPrice !== selectedPosition.stopLoss.fullValue) {
      parsedOrders.push({
        // Changed values comparing to main Order
        side: selectedPosition.side === OrderSideE.Buy ? OrderSideE.Sell : OrderSideE.Buy,
        type: OpenOrderTypeE.StopMarket,
        stopPrice: stopLossPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: selectedPosition.symbol,
        quantity: selectedPosition.positionNotionalBaseCCY,
        leverage: selectedPosition.leverage,
        reduceOnly: true,
        // keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      });
    }

    if (parsedOrders.length > 0) {
      // Execute orderDigest with delay to minimize RPC errors
      setTimeout(() => {
        orderDigest(chainId, parsedOrders, address)
          .then((data) => {
            if (data.data.digests.length > 0) {
              // hide modal now that metamask popup shows up
              approveMarginToken(
                walletClient,
                poolByPosition.marginTokenAddr,
                proxyAddr,
                collateralDeposit,
                poolTokenDecimals
              )
                .then(() => {
                  // trader doesn't need to sign if sending his own orders: signatures are dummy zero hashes
                  const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
                  postOrder(tradingClient, signatures, data.data, false)
                    .then(({ hash }) => {
                      // success submitting order to the node
                      // order was sent
                      setTakeProfitPrice(null);
                      setStopLossPrice(null);
                      toast.success(
                        <ToastContent
                          title={t('pages.trade.action-block.toasts.processed.title')}
                          bodyLines={[{ label: 'Symbol', value: parsedOrders[0].symbol }]}
                        />
                      );
                      setTxHash(hash);
                      setLatestOrderSentTimestamp(Date.now());
                    })
                    .catch((error) => {
                      console.error(error);
                      setLoading(false);
                    })
                    .finally(() => {
                      // ensure we can trade again - but modal is left open if user rejects txn
                      requestSentRef.current = false;
                      setRequestSent(false);
                    });
                })
                .catch((error) => {
                  // not a transaction error, but probably metamask or network -> no toast
                  console.error(error);
                  setLoading(false);
                });
            }
          })
          .catch((error) => {
            // not a transaction error, but probably metamask or network -> no toast
            console.error(error);
            setLoading(false);
          });
      }, 1_000);
    } else {
      requestSentRef.current = false;
      setRequestSent(false);
      setLoading(false);
      closeModal();
    }
  };

  const isDisabledCreateButton =
    !poolByPosition ||
    loading ||
    requestSent ||
    collateralDeposit === null ||
    (takeProfitPrice === selectedPosition.takeProfit.fullValue &&
      stopLossPrice === selectedPosition.stopLoss.fullValue);

  return (
    <Dialog open={isOpen} className={classnames(styles.root, styles.wide)}>
      <DialogTitle>{t('pages.trade.positions-table.modify-modal.tp-sl-title')}</DialogTitle>
      <DialogContent className={styles.contentWithGap}>
        {t('pages.trade.positions-table.modify-modal.tp-sl-position', {
          positionSize: formatToCurrency(selectedPosition.positionNotionalBaseCCY, parsedSymbol?.baseCurrency, true),
        })}
      </DialogContent>
      <Separator />
      <DialogContent className={styles.selectors}>
        <TakeProfitSelector setTakeProfitPrice={setTakeProfitPrice} position={selectedPosition} disabled={loading} />
        <StopLossSelector setStopLossPrice={setStopLossPrice} position={selectedPosition} disabled={loading} />
      </DialogContent>
      <Separator />
      <DialogActions>
        <Button onClick={closeModal} variant="secondary" size="small">
          {t('pages.trade.positions-table.modify-modal.cancel')}
        </Button>
        <GasDepositChecker multiplier={2n}>
          <Button
            onClick={handleModifyPositionConfirm}
            variant="primary"
            size="small"
            disabled={isDisabledCreateButton}
          >
            {loading && <CircularProgress size="24px" sx={{ mr: 2 }} />}
            {t('pages.trade.positions-table.modify-modal.create')}
          </Button>
        </GasDepositChecker>
      </DialogActions>
    </Dialog>
  );
});

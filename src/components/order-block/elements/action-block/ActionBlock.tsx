import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address, useAccount, useChainId, useWaitForTransaction, useWalletClient } from 'wagmi';

import { Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { HashZero } from 'app-constants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useDebounce } from 'helpers/useDebounce';
import { getOpenOrders, getPositionRisk, orderDigest, positionRiskOnTrade } from 'network/network';
import { clearInputsDataAtom, orderInfoAtom, storageKeyAtom } from 'store/order-block.store';
import {
  collateralDepositAtom,
  newPositionRiskAtom,
  openOrdersAtom,
  perpetualStaticInfoAtom,
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  positionsAtom,
  proxyAddrAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { OrderBlockE, OrderTypeE, StopLossE, TakeProfitE } from 'types/enums';
import type { OrderI, OrderInfoI } from 'types/types';
import { formatNumber } from 'utils/formatNumber';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './ActionBlock.module.scss';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getDelegateKey } from 'helpers/getDelegateKey';
import { activatedOneClickTradingAtom } from 'store/app.store';

const SECONDARY_DEADLINE_MULTIPLIER = 24 * 1825;

function createMainOrder(orderInfo: OrderInfoI) {
  let orderType = orderInfo.orderType.toUpperCase();
  if (orderInfo.orderType === OrderTypeE.Stop) {
    orderType = orderInfo.limitPrice !== null && orderInfo.limitPrice > -1 ? 'STOP_LIMIT' : 'STOP_MARKET';
  }

  let limitPrice = orderInfo.limitPrice;
  if (orderInfo.orderType === OrderTypeE.Market) {
    limitPrice = orderInfo.maxMinEntryPrice;
  }

  let deadlineMultiplier = 200; // By default, is it set to 200 hours
  if (orderInfo.orderType !== OrderTypeE.Market && orderInfo.expireDays) {
    deadlineMultiplier = 24 * Number(orderInfo.expireDays);
  }

  return {
    symbol: orderInfo.symbol,
    side: orderInfo.orderBlock === OrderBlockE.Long ? 'BUY' : 'SELL',
    type: orderType,
    limitPrice: limitPrice !== null && limitPrice > -1 ? limitPrice : undefined,
    stopPrice: orderInfo.triggerPrice !== null ? orderInfo.triggerPrice : undefined,
    quantity: orderInfo.size,
    leverage: orderInfo.leverage,
    reduceOnly: orderInfo.reduceOnly !== null ? orderInfo.reduceOnly : undefined,
    keepPositionLvg: orderInfo.keepPositionLeverage,
    executionTimestamp: Math.floor(Date.now() / 1000 - 10),
    deadline: Math.floor(Date.now() / 1000 + 60 * 60 * deadlineMultiplier),
  };
}

const orderBlockMap: Record<OrderBlockE, string> = {
  [OrderBlockE.Long]: 'pages.trade.action-block.order-action.long',
  [OrderBlockE.Short]: 'pages.trade.action-block.order-action.short',
};

const orderTypeMap: Record<OrderTypeE, string> = {
  [OrderTypeE.Market]: 'pages.trade.action-block.order-types.market',
  [OrderTypeE.Limit]: 'pages.trade.action-block.order-types.limit',
  [OrderTypeE.Stop]: 'pages.trade.action-block.order-types.stop',
};

enum ValidityCheckE {
  Empty = '-',
  Closed = 'closed',
  OrderTooLarge = 'order-too-large',
  OrderTooSmall = 'order-too-small',
  PositionTooSmall = 'position-too-small',
  BelowMinPosition = 'below-min-position',
  InsufficientBalance = 'insufficient-balance',
  Undefined = 'undefined',
  GoodToGo = 'good-to-go',
}

export const ActionBlock = memo(() => {
  const { t } = useTranslation();
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: walletClient } = useWalletClient({
    chainId: chainId,
    onError(error) {
      console.log(error);
    },
  });

  const [activatedOneClickTrading] = useAtom(activatedOneClickTradingAtom);
  const [storageKey] = useAtom(storageKeyAtom);
  const [orderInfo] = useAtom(orderInfoAtom);
  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPerpetualStaticInfo] = useAtom(perpetualStaticInfoAtom);
  const [newPositionRisk, setNewPositionRisk] = useAtom(newPositionRiskAtom);
  const [positions, setPositions] = useAtom(positionsAtom);
  const [collateralDeposit, setCollateralDeposit] = useAtom(collateralDepositAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [poolTokenBalance] = useAtom(poolTokenBalanceAtom);
  const [poolTokenDecimals] = useAtom(poolTokenDecimalsAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);
  const setOpenOrders = useSetAtom(openOrdersAtom);

  const [isValidityCheckDone, setIsValidityCheckDone] = useState(false);
  const [showReviewOrderModal, setShowReviewOrderModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [maxOrderSize, setMaxOrderSize] = useState<{ maxBuy: number; maxSell: number }>();
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);

  const requestSentRef = useRef(false);
  const validityCheckRef = useRef(false);

  const tradingClient = useMemo(() => {
    if (activatedOneClickTrading && storageKey && walletClient?.chain && window?.ethereum) {
      const dlgt = getDelegateKey(walletClient, storageKey);
      if (dlgt) {
        return createWalletClient({
          account: privateKeyToAccount(dlgt as Address),
          chain: walletClient.chain,
          transport: http(),
        });
      }
    }
    return walletClient;
  }, [walletClient, storageKey, activatedOneClickTrading]);

  const openReviewOrderModal = async () => {
    if (!orderInfo || !address || !traderAPI) {
      return;
    }
    validityCheckRef.current = true;
    setShowReviewOrderModal(true);
    setNewPositionRisk(null);
    setMaxOrderSize(undefined);
    const mainOrder = createMainOrder(orderInfo);
    await positionRiskOnTrade(
      chainId,
      traderAPI,
      mainOrder,
      address,
      positions?.find((pos) => pos.symbol === orderInfo.symbol)
    )
      .then((data) => {
        setNewPositionRisk(data.data.newPositionRisk);
        setCollateralDeposit(data.data.orderCost);
        setMaxOrderSize({ maxBuy: data.data.maxLongTrade, maxSell: data.data.maxShortTrade });
      })
      .catch(console.error)
      .finally(() => {
        validityCheckRef.current = false;
      });
  };

  const closeReviewOrderModal = () => {
    setShowReviewOrderModal(false);
    setIsValidityCheckDone(false);
  };

  const isBuySellButtonActive = useMemo(() => {
    if (!orderInfo || !address) {
      return false;
    }
    if (
      !orderInfo.size ||
      !selectedPerpetualStaticInfo?.lotSizeBC ||
      orderInfo.size < selectedPerpetualStaticInfo.lotSizeBC
    ) {
      return false;
    }
    if (orderInfo.orderType === OrderTypeE.Limit && (orderInfo.limitPrice === null || orderInfo.limitPrice <= 0)) {
      return false;
    }
    return !(orderInfo.orderType === OrderTypeE.Stop && (!orderInfo.triggerPrice || orderInfo.triggerPrice <= 0));
  }, [orderInfo, address, selectedPerpetualStaticInfo?.lotSizeBC]);

  const parsedOrders = useMemo(() => {
    if (requestSentRef.current || requestSent) {
      return;
    }

    if (!isBuySellButtonActive) {
      return;
    }

    if (!address || !orderInfo || !selectedPool || !proxyAddr) {
      return;
    }

    const orders: OrderI[] = [];

    orders.push(createMainOrder(orderInfo));

    if (orderInfo.stopLoss !== StopLossE.None && orderInfo.stopLossPrice) {
      orders.push({
        // Changed values comparing to main Order
        side: orderInfo.orderBlock === OrderBlockE.Long ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        stopPrice: orderInfo.stopLossPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: orderInfo.symbol,
        quantity: orderInfo.size,
        leverage: orderInfo.leverage,
        reduceOnly: orderInfo.reduceOnly !== null ? orderInfo.reduceOnly : undefined,
        keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10),
      });
    }

    if (orderInfo.takeProfit !== TakeProfitE.None && orderInfo.takeProfitPrice) {
      orders.push({
        // Changed values comparing to main Order
        side: orderInfo.orderBlock === OrderBlockE.Long ? 'SELL' : 'BUY',
        type: OrderTypeE.Limit.toUpperCase(),
        limitPrice: orderInfo.takeProfitPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: orderInfo.symbol,
        quantity: orderInfo.size,
        leverage: orderInfo.leverage,
        reduceOnly: orderInfo.reduceOnly !== null ? orderInfo.reduceOnly : undefined,
        keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10),
      });
    }
    return orders;
  }, [orderInfo, selectedPool, address, proxyAddr, requestSent, isBuySellButtonActive]);

  useWaitForTransaction({
    hash: txHash,
    onSuccess() {
      toast.success(
        <ToastContent
          title={t('pages.trade.action-block.toasts.order-submitted.title')}
          bodyLines={[
            {
              label: t('pages.trade.action-block.toasts.order-submitted.body'),
              value: orderInfo?.symbol,
            },
          ]}
        />
      );
    },
    onError() {
      toast.error(<ToastContent title={t('pages.trade.action-block.toasts.error.title')} bodyLines={[]} />);
    },
    onSettled() {
      setTxHash(undefined);
      getOpenOrders(chainId, traderAPI, address as Address)
        .then(({ data: d }) => {
          if (d?.length > 0) {
            d.map(setOpenOrders);
          }
        })
        .catch(console.error);
      setTimeout(() => {
        getOpenOrders(chainId, traderAPI, address as Address)
          .then(({ data: d }) => {
            if (d?.length > 0) {
              d.map(setOpenOrders);
            }
          })
          .catch(console.error);
        getPositionRisk(chainId, traderAPI, address as Address, Date.now())
          .then(({ data }) => {
            if (data && data.length > 0) {
              data.map(setPositions);
            }
          })
          .catch(console.error);
      }, 30_000);
    },
    enabled: !!address && !!orderInfo && !!txHash,
  });

  const handleOrderConfirm = () => {
    if (
      !address ||
      !walletClient ||
      !tradingClient ||
      !parsedOrders ||
      !selectedPool ||
      !proxyAddr ||
      !poolTokenDecimals
    ) {
      return;
    }
    setRequestSent(true);
    setIsValidityCheckDone(false);
    requestSentRef.current = true;
    orderDigest(chainId, parsedOrders, address)
      .then((data) => {
        if (data.data.digests.length > 0) {
          // hide modal now that metamask popup shows up
          approveMarginToken(
            walletClient,
            selectedPool.marginTokenAddr,
            proxyAddr,
            collateralDeposit,
            poolTokenDecimals
          )
            .then(() => {
              // trader doesn't need to sign if sending his own orders: signatures are dummy zero hashes
              const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
              postOrder(tradingClient, signatures, data.data)
                .then((tx) => {
                  setShowReviewOrderModal(false);
                  // success submitting order to the node
                  console.log(`postOrder tx hash: ${tx.hash}`);
                  // order was sent
                  clearInputsData();
                  toast.success(
                    <ToastContent
                      title={t('pages.trade.action-block.toasts.processed.title')}
                      bodyLines={[{ label: 'Symbol', value: parsedOrders[0].symbol }]}
                    />
                  );
                  setTxHash(tx.hash);
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
              // ensure we can trade again
              requestSentRef.current = false;
              setRequestSent(false);
              setShowReviewOrderModal(false);
            });
        } else {
          // ensure we can trade again
          requestSentRef.current = false;
          setRequestSent(false);
          setShowReviewOrderModal(false);
        }
      })
      .catch((error) => {
        // not a transaction error, but probably metamask or network -> no toast
        console.error(error);
        // ensure we can trade again
        requestSentRef.current = false;
        setRequestSent(false);
        setShowReviewOrderModal(false);
      });
  };

  const atPrice = useMemo(() => {
    if (orderInfo) {
      let price = orderInfo.midPrice;
      if (orderInfo.orderType === OrderTypeE.Limit && orderInfo.limitPrice) {
        price = orderInfo.limitPrice;
      } else if (orderInfo.orderType === OrderTypeE.Stop && orderInfo.triggerPrice) {
        price = orderInfo.triggerPrice;
      }
      return formatToCurrency(price, orderInfo.quoteCurrency);
    }
    return '-';
  }, [orderInfo]);

  const isMarketClosed = useDebounce(
    useMemo(() => {
      return selectedPerpetual?.isMarketClosed;
    }, [selectedPerpetual]),
    30_000
  );

  const positionToModify = useDebounce(
    useMemo(() => {
      return positions?.find((pos) => pos.symbol === orderInfo?.symbol);
    }, [positions, orderInfo?.symbol]),
    1_000
  );

  const validityCheckType = useMemo(() => {
    if (
      !showReviewOrderModal ||
      validityCheckRef.current ||
      !maxOrderSize ||
      !orderInfo?.orderBlock ||
      !selectedPerpetualStaticInfo?.lotSizeBC
    ) {
      return ValidityCheckE.Empty;
    }
    let isTooLarge;
    if (orderInfo.orderBlock === OrderBlockE.Long) {
      isTooLarge = orderInfo.size > maxOrderSize.maxBuy;
    } else {
      isTooLarge = orderInfo.size > maxOrderSize.maxSell;
    }
    if (isTooLarge) {
      return ValidityCheckE.OrderTooLarge;
    }
    const isOrderTooSmall = orderInfo.size > 0 && orderInfo.size < selectedPerpetualStaticInfo.lotSizeBC;
    if (isOrderTooSmall) {
      return ValidityCheckE.OrderTooSmall;
    }
    const isPositionTooSmall =
      (!positionToModify || positionToModify.positionNotionalBaseCCY === 0) &&
      orderInfo.size < 10 * selectedPerpetualStaticInfo.lotSizeBC;
    if (isPositionTooSmall && orderInfo.orderType === OrderTypeE.Market) {
      return ValidityCheckE.PositionTooSmall;
    } else if (
      orderInfo.size < 10 * selectedPerpetualStaticInfo.lotSizeBC &&
      orderInfo.orderType !== OrderTypeE.Market
    ) {
      return ValidityCheckE.BelowMinPosition;
    }
    if (poolTokenBalance === undefined || poolTokenBalance < collateralDeposit) {
      return ValidityCheckE.InsufficientBalance;
      // return `${t('pages.trade.action-block.validity.insufficient-balance')} {' '} ${poolTokenBalance}`;
    }
    if (orderInfo.takeProfitPrice !== null && orderInfo.takeProfitPrice <= 0) {
      return ValidityCheckE.Undefined;
    }
    if (isMarketClosed) {
      return ValidityCheckE.Closed;
    }
    return ValidityCheckE.GoodToGo;
  }, [
    maxOrderSize,
    orderInfo?.size,
    orderInfo?.orderBlock,
    orderInfo?.orderType,
    orderInfo?.takeProfitPrice,
    selectedPerpetualStaticInfo?.lotSizeBC,
    poolTokenBalance,
    isMarketClosed,
    collateralDeposit,
    positionToModify,
    showReviewOrderModal,
  ]);

  const validityCheckText = useMemo(() => {
    if (validityCheckType === ValidityCheckE.Empty) {
      return '-';
    } else if (validityCheckType === ValidityCheckE.InsufficientBalance) {
      return `${t('pages.trade.action-block.validity.insufficient-balance')} ${poolTokenBalance}`;
    }
    return t(`pages.trade.action-block.validity.${validityCheckType}`);
  }, [t, validityCheckType, poolTokenBalance]);

  const isOrderValid =
    validityCheckType === ValidityCheckE.GoodToGo ||
    validityCheckType === ValidityCheckE.Closed ||
    validityCheckType === ValidityCheckE.BelowMinPosition;

  const isConfirmButtonDisabled = useMemo(() => {
    return !isOrderValid || requestSentRef.current || requestSent;
  }, [isOrderValid, requestSent]);

  const validityColor = [ValidityCheckE.GoodToGo, ValidityCheckE.Closed].some((x) => x === validityCheckType)
    ? 'rgba(var(--d8x-background-buy-rgb), 1)'
    : 'rgba(var(--d8x-background-sell-rgb), 1)';

  useEffect(() => {
    if (validityCheckType === ValidityCheckE.GoodToGo) {
      setIsValidityCheckDone(true);
      return;
    } else if (validityCheckType === ValidityCheckE.Empty) {
      setIsValidityCheckDone(false);
      return;
    }
    setIsValidityCheckDone(true);
    return;
  }, [validityCheckType]);

  const feePct = useMemo(() => {
    if (orderInfo?.tradingFee) {
      return (
        (orderInfo.tradingFee * 0.01) / (1 + (orderInfo.stopLossPrice ? 1 : 0) + (orderInfo.takeProfitPrice ? 1 : 0))
      );
    }
  }, [orderInfo]);

  return (
    <Box className={styles.root}>
      <Button
        variant={orderInfo?.orderBlock === OrderBlockE.Short ? 'sell' : 'buy'}
        disabled={!isBuySellButtonActive}
        onClick={openReviewOrderModal}
        className={styles.buyButton}
      >
        {t(orderBlockMap[orderInfo?.orderBlock ?? OrderBlockE.Long])}{' '}
        {t(orderTypeMap[orderInfo?.orderType ?? OrderTypeE.Market])}
      </Button>
      {orderInfo && (
        <Dialog open={showReviewOrderModal} className={styles.dialog}>
          <DialogTitle className={styles.dialogTitle}> {t('pages.trade.action-block.review.title')} </DialogTitle>
          <Box className={styles.emphasis}>
            <SidesRow
              leftSide={
                <Typography variant="bodyLargePopup" className={styles.semibold}>
                  {orderInfo.leverage > 0 ? `${formatNumber(orderInfo.leverage)}x` : ''}{' '}
                  {t(orderTypeMap[orderInfo.orderType])} {t(orderBlockMap[orderInfo.orderBlock])}
                </Typography>
              }
              rightSide={
                <Typography variant="bodyLargePopup" className={styles.semibold}>
                  {orderInfo.size} {orderInfo.baseCurrency} @ {atPrice}
                </Typography>
              }
            />
          </Box>
          <DialogContent>
            <Box className={styles.orderDetails}>
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.deposit')}{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && collateralDeposit >= 0 ? formatToCurrency(collateralDeposit, orderInfo.poolName) : '-'
                }
                rightSideStyles={styles.rightSide}
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.balance')}{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && poolTokenBalance && poolTokenBalance >= 0
                    ? formatToCurrency(poolTokenBalance, orderInfo.poolName)
                    : '-'
                }
                rightSideStyles={styles.rightSide}
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.fee')}{' '}
                  </Typography>
                }
                rightSide={feePct ? formatToCurrency(feePct, '%', false, 3) : '-'}
                rightSideStyles={styles.rightSide}
              />

              {orderInfo.maxMinEntryPrice !== null && (
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmallPopup" className={styles.left}>
                      {orderInfo.orderBlock === OrderBlockE.Long
                        ? t('pages.trade.action-block.review.max')
                        : t('pages.trade.action-block.review.min')}
                    </Typography>
                  }
                  rightSide={formatToCurrency(orderInfo.maxMinEntryPrice, orderInfo.quoteCurrency)}
                  rightSideStyles={styles.rightSide}
                />
              )}
              {orderInfo.triggerPrice !== null && (
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmallPopup" className={styles.left}>
                      {' '}
                      {t('pages.trade.action-block.review.trigger-price')}{' '}
                    </Typography>
                  }
                  rightSide={formatToCurrency(orderInfo.triggerPrice, orderInfo.quoteCurrency)}
                  rightSideStyles={styles.rightSide}
                />
              )}
              {orderInfo.limitPrice !== null && (
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmallPopup" className={styles.left}>
                      {' '}
                      {t('pages.trade.action-block.review.limit-price')}{' '}
                    </Typography>
                  }
                  rightSide={
                    orderInfo.limitPrice > -1 && orderInfo.limitPrice < Infinity
                      ? formatToCurrency(orderInfo.limitPrice, orderInfo.quoteCurrency)
                      : '-'
                  }
                  rightSideStyles={styles.rightSide}
                />
              )}
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.stop-loss')}{' '}
                  </Typography>
                }
                rightSide={
                  orderInfo.stopLossPrice && orderInfo.stopLossPrice > 0
                    ? formatToCurrency(orderInfo.stopLossPrice, orderInfo.quoteCurrency)
                    : '-'
                }
                rightSideStyles={styles.rightSide}
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.take-profit')}{' '}
                  </Typography>
                }
                rightSide={
                  orderInfo.takeProfitPrice && orderInfo.takeProfitPrice > 0
                    ? formatToCurrency(orderInfo.takeProfitPrice, orderInfo.quoteCurrency)
                    : '-'
                }
                rightSideStyles={styles.rightSide}
              />
            </Box>
          </DialogContent>
          <Separator />
          <DialogContent>
            <Box className={styles.newPositionHeader}>
              <Typography variant="bodyMediumPopup" className={styles.bold}>
                {t('pages.trade.action-block.review.details')}
              </Typography>
            </Box>
            <Box className={styles.newPositionDetails}>
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.size')}{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && newPositionRisk
                    ? formatToCurrency(newPositionRisk.positionNotionalBaseCCY, orderInfo.baseCurrency)
                    : '-'
                }
                rightSideStyles={styles.rightSide}
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.margin')}{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && newPositionRisk && newPositionRisk.collateralCC >= 0
                    ? formatToCurrency(newPositionRisk.collateralCC, orderInfo.poolName)
                    : '-'
                }
                rightSideStyles={styles.rightSide}
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.leverage')}{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && newPositionRisk && newPositionRisk.leverage > 0 && newPositionRisk.leverage < Infinity
                    ? `${formatNumber(newPositionRisk.leverage)}x`
                    : '-'
                }
                rightSideStyles={styles.rightSide}
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmallPopup" className={styles.left}>
                    {' '}
                    {t('pages.trade.action-block.review.liq-price')}{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid &&
                  newPositionRisk &&
                  newPositionRisk.liquidationPrice[0] > 0 &&
                  newPositionRisk.liquidationPrice[0] < Infinity
                    ? formatToCurrency(newPositionRisk.liquidationPrice[0] ?? 0, orderInfo.quoteCurrency)
                    : '-'
                }
                rightSideStyles={styles.rightSide}
              />
            </Box>
          </DialogContent>
          <Box className={styles.emphasis}>
            <SidesRow
              leftSide={
                <Typography variant="bodyMediumPopup" className={styles.semibold}>
                  {t('pages.trade.action-block.review.validity-checks')}
                </Typography>
              }
              rightSide={
                !isValidityCheckDone ? (
                  <Box>
                    <CircularProgress color="primary" />
                  </Box>
                ) : (
                  <Typography variant="bodyMediumPopup" className={styles.bold} style={{ color: validityColor }}>
                    {validityCheckType !== ValidityCheckE.Empty
                      ? t(
                          `pages.trade.action-block.validity.${
                            [ValidityCheckE.GoodToGo, ValidityCheckE.Closed].some((x) => x === validityCheckType)
                              ? 'pass'
                              : 'fail'
                          }`
                        )
                      : ' '}
                  </Typography>
                )
              }
            />
          </Box>
          <DialogContent>
            {isValidityCheckDone ? (
              <Box className={styles.goMessage}>
                <Typography variant="bodySmallPopup" className={styles.centered} style={{ color: validityColor }}>
                  {validityCheckText}
                </Typography>
              </Box>
            ) : (
              ''
            )}
          </DialogContent>
          <DialogActions className={styles.dialogActions}>
            <Button onClick={closeReviewOrderModal} variant="secondary" size="small">
              {t('pages.trade.action-block.review.cancel')}
            </Button>
            <Button onClick={handleOrderConfirm} variant="primary" size="small" disabled={isConfirmButtonDisabled}>
              {t('pages.trade.action-block.review.confirm')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
});

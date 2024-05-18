import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { HashZero, SECONDARY_DEADLINE_MULTIPLIER } from 'appConstants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { getTxnLink } from 'helpers/getTxnLink';
import { useDebounce } from 'helpers/useDebounce';
import { orderSubmitted } from 'network/broker';
import { orderDigest, positionRiskOnTrade } from 'network/network';
import { tradingClientAtom } from 'store/app.store';
import { depositModalOpenAtom } from 'store/global-modals.store';
import { clearInputsDataAtom, latestOrderSentTimestampAtom, orderInfoAtom } from 'store/order-block.store';
import {
  collateralDepositAtom,
  newPositionRiskAtom,
  perpetualStaticInfoAtom,
  poolFeeAtom,
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  positionsAtom,
  proxyAddrAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { MethodE, OrderBlockE, OrderSideE, OrderTypeE, StopLossE, TakeProfitE } from 'types/enums';
import type { OrderI, OrderInfoI } from 'types/types';
import { formatNumber } from 'utils/formatNumber';
import { formatToCurrency } from 'utils/formatToCurrency';
import { isEnabledChain } from 'utils/isEnabledChain';

import { useMinPositionString } from '../../hooks/useMinPositionString';
import { currencyMultiplierAtom, selectedCurrencyAtom } from '../order-size/store';
import { hasTpSlOrdersAtom } from './store';

import styles from './ActionBlock.module.scss';

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
    side: orderInfo.orderBlock === OrderBlockE.Long ? OrderSideE.Buy : OrderSideE.Sell,
    type: orderType,
    limitPrice: limitPrice !== null && limitPrice > -1 ? limitPrice : undefined,
    stopPrice: orderInfo.triggerPrice !== null ? orderInfo.triggerPrice : undefined,
    quantity: orderInfo.size,
    leverage: orderInfo.leverage,
    reduceOnly: orderInfo.reduceOnly !== null ? orderInfo.reduceOnly : undefined,
    keepPositionLvg: orderInfo.keepPositionLeverage,
    executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
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
  SlippageTooLarge = 'slippage-too-large',
}

enum ValidityCheckButtonE {
  Empty = '-',
  WrongNetwork = 'wrong-network',
  NoAddress = 'not-connected',
  NoEnoughGas = 'no-enough-gas',
  NoFunds = 'no-funds',
  AmountBelowMinimum = 'amount-below-min',
  GoodToGo = 'good-to-go',
  NoAmount = 'no-amount',
  NoLimitPrice = 'no-limit-price',
  NoTriggerPrice = 'no-trigger-price',
}

export const ActionBlock = memo(() => {
  const { t } = useTranslation();

  const { address, chain, chainId } = useAccount();
  const { data: walletClient } = useWalletClient({
    chainId,
  });

  const { hasEnoughGasForFee } = useUserWallet();

  const orderInfo = useAtomValue(orderInfoAtom);
  const proxyAddr = useAtomValue(proxyAddrAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedCurrency = useAtomValue(selectedCurrencyAtom);
  const selectedPerpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const positions = useAtomValue(positionsAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const poolTokenBalance = useAtomValue(poolTokenBalanceAtom);
  const poolTokenDecimals = useAtomValue(poolTokenDecimalsAtom);
  const tradingClient = useAtomValue(tradingClientAtom);
  const hasTpSlOrders = useAtomValue(hasTpSlOrdersAtom);
  const poolFee = useAtomValue(poolFeeAtom);
  const currencyMultiplier = useAtomValue(currencyMultiplierAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);
  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);
  const [newPositionRisk, setNewPositionRisk] = useAtom(newPositionRiskAtom);
  const [collateralDeposit, setCollateralDeposit] = useAtom(collateralDepositAtom);

  const [isValidityCheckDone, setIsValidityCheckDone] = useState(false);
  const [showReviewOrderModal, setShowReviewOrderModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [maxOrderSize, setMaxOrderSize] = useState<{ maxBuy: number; maxSell: number }>();
  const [txHash, setTxHash] = useState<Address>();

  const requestSentRef = useRef(false);
  const validityCheckRef = useRef(false);

  const { minPositionString } = useMinPositionString(currencyMultiplier, perpetualStaticInfo);

  const openReviewOrderModal = async () => {
    if (!orderInfo || !address || !traderAPI || !poolFee || !chainId || !isEnabledChain(chainId)) {
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
      positions?.find((pos) => pos.symbol === orderInfo.symbol),
      poolFee
    )
      .then((data) => {
        setNewPositionRisk(data.data.newPositionRisk);
        setCollateralDeposit(data.data.orderCost);
        let [maxLong, maxShort] = [data.data.maxLongTrade, data.data.maxShortTrade];
        if (
          selectedPerpetualStaticInfo &&
          data.data.newPositionRisk.leverage > 1 / selectedPerpetualStaticInfo.initialMarginRate
        ) {
          if (orderInfo.orderBlock === OrderBlockE.Long) {
            maxLong = 0;
          } else {
            maxShort = 0;
          }
        }
        setMaxOrderSize({ maxBuy: maxLong, maxSell: maxShort });
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

  const validityCheckButtonType = useMemo(() => {
    if (!address || !orderInfo) {
      return ValidityCheckButtonE.NoAddress;
    }
    if (!isEnabledChain(chainId)) {
      return ValidityCheckButtonE.WrongNetwork;
    }
    if (poolTokenBalance === 0) {
      return ValidityCheckButtonE.NoFunds;
    }
    if (!hasEnoughGasForFee(MethodE.Interact, 3n)) {
      return ValidityCheckButtonE.NoEnoughGas;
    }
    if (orderInfo.size === 0) {
      return ValidityCheckButtonE.NoAmount;
    }
    if (orderInfo.orderType === OrderTypeE.Limit && (orderInfo.limitPrice === null || orderInfo.limitPrice <= 0)) {
      return ValidityCheckButtonE.NoLimitPrice;
    }
    if (orderInfo.orderType === OrderTypeE.Stop && (!orderInfo.triggerPrice || orderInfo.triggerPrice <= 0)) {
      return ValidityCheckButtonE.NoTriggerPrice;
    }
    return ValidityCheckButtonE.GoodToGo;
  }, [orderInfo, address, chainId, poolTokenBalance, hasEnoughGasForFee]);

  const validityCheckButtonText = useMemo(() => {
    if (validityCheckButtonType === ValidityCheckButtonE.NoAddress) {
      return `${t('pages.trade.action-block.validity.button-no-address')}`;
    } else if (validityCheckButtonType === ValidityCheckButtonE.WrongNetwork) {
      return `${t('error.wrong-network')}`;
    } else if (validityCheckButtonType === ValidityCheckButtonE.NoFunds) {
      return `${t('pages.trade.action-block.validity.button-no-funds')}`;
    } else if (validityCheckButtonType === ValidityCheckButtonE.NoEnoughGas) {
      return `${t('common.deposit-gas')}`;
    } else if (validityCheckButtonType === ValidityCheckButtonE.NoAmount) {
      return `${t('pages.trade.action-block.validity.button-no-amount')}`;
    } else if (validityCheckButtonType === ValidityCheckButtonE.NoLimitPrice) {
      return `${t('pages.trade.action-block.validity.button-no-limit')}`;
    } else if (validityCheckButtonType === ValidityCheckButtonE.NoTriggerPrice) {
      return `${t('pages.trade.action-block.validity.button-no-trigger')}`;
    }
    return `${t(orderBlockMap[orderInfo?.orderBlock ?? OrderBlockE.Long])} ${` `} 
            ${t(orderTypeMap[orderInfo?.orderType ?? OrderTypeE.Market])}`;
  }, [t, validityCheckButtonType, orderInfo?.orderBlock, orderInfo?.orderType]);

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
        side: orderInfo.orderBlock === OrderBlockE.Long ? OrderSideE.Sell : OrderSideE.Buy,
        type: 'STOP_MARKET',
        stopPrice: orderInfo.stopLossPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: orderInfo.symbol,
        quantity: orderInfo.size,
        leverage: orderInfo.leverage,
        reduceOnly: true,
        keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      });
    }

    if (orderInfo.takeProfit !== TakeProfitE.None && orderInfo.takeProfitPrice) {
      orders.push({
        // Changed values comparing to main Order
        side: orderInfo.orderBlock === OrderBlockE.Long ? OrderSideE.Sell : OrderSideE.Buy,
        type: OrderTypeE.Limit.toUpperCase(),
        limitPrice: orderInfo.takeProfitPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: orderInfo.symbol,
        quantity: orderInfo.size,
        leverage: orderInfo.leverage,
        reduceOnly: true,
        keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      });
    }
    return orders;
  }, [orderInfo, selectedPool, address, proxyAddr, requestSent, isBuySellButtonActive]);

  const { isSuccess, isError, isFetched } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!orderInfo && !!txHash },
  });

  useEffect(() => {
    if (!isFetched || !txHash) {
      return;
    }
    setTxHash(undefined);
    setLatestOrderSentTimestamp(Date.now());
  }, [isFetched, txHash, setLatestOrderSentTimestamp]);

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
            value: orderInfo?.symbol,
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
  }, [isSuccess, txHash, chain, orderInfo?.symbol, setLatestOrderSentTimestamp, t]);

  const handleOrderConfirm = () => {
    if (
      !address ||
      !walletClient ||
      !tradingClient ||
      !parsedOrders ||
      !selectedPool ||
      !proxyAddr ||
      !poolTokenDecimals ||
      !isEnabledChain(chainId) ||
      !chainId
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
                  // success submitting order to the node - inform backend
                  orderSubmitted(walletClient.chain.id, data.data.orderIds).then().catch(console.error);
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
    }
    if (orderInfo.takeProfitPrice !== null && orderInfo.takeProfitPrice <= 0) {
      return ValidityCheckE.Undefined;
    }
    if (isMarketClosed) {
      return ValidityCheckE.Closed;
    }
    if (
      orderInfo.orderType === OrderTypeE.Market &&
      orderInfo.maxMinEntryPrice !== null &&
      selectedPerpetual?.midPrice !== undefined
    ) {
      let isSlippageTooLarge;
      if (orderInfo.orderBlock === OrderBlockE.Long) {
        isSlippageTooLarge = orderInfo.maxMinEntryPrice < selectedPerpetual?.midPrice;
      } else {
        isSlippageTooLarge = orderInfo.maxMinEntryPrice > selectedPerpetual?.midPrice;
      }
      if (isSlippageTooLarge) {
        return ValidityCheckE.SlippageTooLarge;
      }
    }
    return ValidityCheckE.GoodToGo;
  }, [
    maxOrderSize,
    orderInfo?.size,
    orderInfo?.orderBlock,
    orderInfo?.orderType,
    orderInfo?.takeProfitPrice,
    orderInfo?.maxMinEntryPrice,
    selectedPerpetual,
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
    } else if (validityCheckType === ValidityCheckE.PositionTooSmall) {
      return `${t('pages.trade.action-block.validity.position-too-small', {
        minAmount: `${minPositionString} ${selectedCurrency}`,
      })}`;
    }
    return t(`pages.trade.action-block.validity.${validityCheckType}`);
  }, [t, validityCheckType, poolTokenBalance, minPositionString, selectedCurrency]);

  const isOrderValid =
    validityCheckType === ValidityCheckE.GoodToGo ||
    validityCheckType === ValidityCheckE.Closed ||
    validityCheckType === ValidityCheckE.SlippageTooLarge;

  const isConfirmButtonDisabled = useMemo(() => {
    return !isOrderValid || requestSentRef.current || requestSent;
  }, [isOrderValid, requestSent]);

  const validityColor = [ValidityCheckE.GoodToGo, ValidityCheckE.Closed].some((x) => x === validityCheckType)
    ? 'var(--d8x-color-buy-rgba)'
    : 'var(--d8x-color-sell-rgba)';

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
    <div className={styles.root}>
      {[ValidityCheckButtonE.NoFunds, ValidityCheckButtonE.NoEnoughGas].includes(validityCheckButtonType) && (
        <Button variant={'buy'} onClick={() => setDepositModalOpen(true)} className={styles.buyButton}>
          {validityCheckButtonText}
        </Button>
      )}
      {![ValidityCheckButtonE.NoFunds, ValidityCheckButtonE.NoEnoughGas].includes(validityCheckButtonType) && (
        <Button
          variant={orderInfo?.orderBlock === OrderBlockE.Short ? 'sell' : 'buy'}
          disabled={!isBuySellButtonActive}
          onClick={openReviewOrderModal}
          className={styles.buyButton}
        >
          {validityCheckButtonText}
        </Button>
      )}
      {orderInfo && isEnabledChain(chainId) && (
        <Dialog open={showReviewOrderModal} className={styles.dialog}>
          <DialogTitle className={styles.dialogTitle}> {t('pages.trade.action-block.review.title')} </DialogTitle>
          <div className={styles.emphasis}>
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
          </div>
          <DialogContent>
            <div className={styles.orderDetails}>
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
            </div>
          </DialogContent>
          <Separator />
          <DialogContent>
            <div className={styles.newPositionHeader}>
              <Typography variant="bodyMediumPopup" className={styles.bold}>
                {t('pages.trade.action-block.review.details')}
              </Typography>
            </div>
            <div className={styles.newPositionDetails}>
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
            </div>
          </DialogContent>
          <div className={styles.emphasis}>
            <SidesRow
              leftSide={
                <Typography variant="bodyMediumPopup" className={styles.semibold}>
                  {t('pages.trade.action-block.review.validity-checks')}
                </Typography>
              }
              rightSide={
                !isValidityCheckDone ? (
                  <div>
                    <CircularProgress color="primary" />
                  </div>
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
          </div>
          <DialogContent>
            {isValidityCheckDone ? (
              <div className={styles.goMessage}>
                <Typography variant="bodySmallPopup" className={styles.centered} style={{ color: validityColor }}>
                  {validityCheckText}
                </Typography>
              </div>
            ) : (
              ''
            )}
          </DialogContent>
          {hasTpSlOrders && (
            <DialogContent>
              <Typography
                variant="bodySmallPopup"
                className={styles.centered}
                style={{ color: 'var(--d8x-color-warning-secondary)' }}
              >
                {t('pages.trade.action-block.validity.verify-tp-sl-orders')}
              </Typography>
            </DialogContent>
          )}
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
    </div>
  );
});

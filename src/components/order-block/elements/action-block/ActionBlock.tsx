import { BUY_SIDE, pmInitialMarginRate, TraderInterface } from '@d8x/perpetuals-sdk';
import classnames from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, CircularProgress, Typography } from '@mui/material';

import ActionErrorIcon from 'assets/icons/new/actionError.svg?react';
import ActionSuccessIcon from 'assets/icons/new/actionSuccess.svg?react';
import WalletContentIcon from 'assets/icons/new/walletContent.svg?react';
import { HashZero, SECONDARY_DEADLINE_MULTIPLIER } from 'appConstants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { SeparatorTypeE } from 'components/separator/enums';
import { Separator } from 'components/separator/Separator';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { calculatePrice } from 'helpers/calculatePrice';
import { calculateProbability } from 'helpers/calculateProbability';
import { getTxnLink } from 'helpers/getTxnLink';
import { useDebounce } from 'helpers/useDebounce';
import { orderDigest, positionRiskOnTrade } from 'network/network';
import { tradingClientAtom } from 'store/app.store';
import { depositModalOpenAtom } from 'store/global-modals.store';
import { clearInputsDataAtom, latestOrderSentTimestampAtom, orderInfoAtom } from 'store/order-block.store';
import {
  collateralDepositAtom,
  collateralToSettleConversionAtom,
  newPositionRiskAtom,
  perpetualPriceAtom,
  perpetualStaticInfoAtom,
  poolFeeAtom,
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  positionsAtom,
  proxyAddrAtom,
  selectedPerpetualAtom,
  selectedPerpetualDataAtom,
  selectedPoolAtom,
  traderAPIAtom,
  flatTokenAtom,
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
  const isPredictionMarket = orderInfo.isPredictionMarket;

  if (orderInfo.orderType === OrderTypeE.Stop) {
    orderType = orderInfo.limitPrice !== null && orderInfo.limitPrice > -1 ? 'STOP_LIMIT' : 'STOP_MARKET';
  }

  const isNoVote = orderInfo.orderBlock === OrderBlockE.Short;
  let limitPrice =
    isPredictionMarket && orderInfo.limitPrice !== null
      ? calculatePrice(orderInfo.limitPrice, isNoVote)
      : orderInfo.limitPrice;

  if (orderInfo.orderType === OrderTypeE.Market) {
    limitPrice = null;
  }

  const stopPrice =
    isPredictionMarket && orderInfo.triggerPrice !== null
      ? calculatePrice(orderInfo.triggerPrice, isNoVote)
      : orderInfo.triggerPrice;

  let deadlineMultiplier = 200; // By default, is it set to 200 hours
  if (orderInfo.orderType !== OrderTypeE.Market && orderInfo.expireDays) {
    deadlineMultiplier = 24 * Number(orderInfo.expireDays);
  }

  return {
    symbol: orderInfo.symbol,
    side: orderInfo.orderBlock === OrderBlockE.Long ? OrderSideE.Buy : OrderSideE.Sell,
    type: orderType,
    limitPrice: limitPrice !== null && limitPrice > -1 && !isPredictionMarket ? limitPrice : undefined,
    stopPrice: stopPrice !== null ? stopPrice : undefined,
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

const predictionOrderBlockMap: Record<OrderBlockE, string> = {
  [OrderBlockE.Long]: 'pages.trade.order-block.prediction.yes',
  [OrderBlockE.Short]: 'pages.trade.order-block.prediction.no',
};

const orderTypeMap: Record<OrderTypeE, string> = {
  [OrderTypeE.Market]: 'pages.trade.action-block.order-types.market',
  [OrderTypeE.Limit]: 'pages.trade.action-block.order-types.limit',
  [OrderTypeE.Stop]: 'pages.trade.action-block.order-types.stop',
};

enum ValidityCheckE {
  Empty = '-',
  Closed = 'closed',
  OrderTooSmall = 'order-too-small',
  PositionTooSmall = 'position-too-small',
  BelowMinPosition = 'below-min-position',
  InsufficientBalance = 'insufficient-balance',
  Undefined = 'undefined',
  GoodToGo = 'good-to-go',
  SlippageTooLarge = 'slippage-too-large',
  OrderTooLarge = 'order-too-large',
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
  ClosedPrediction = 'closed-prediction',
}

export const ActionBlock = memo(() => {
  const { t } = useTranslation();

  const { address, chain, chainId } = useAccount();
  const { data: walletClient } = useWalletClient({
    chainId,
  });

  const { hasEnoughGasForFee, isMultisigAddress } = useUserWallet();

  const orderInfo = useAtomValue(orderInfoAtom);
  const proxyAddr = useAtomValue(proxyAddrAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedCurrency = useAtomValue(selectedCurrencyAtom);
  const flatToken = useAtomValue(flatTokenAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const positions = useAtomValue(positionsAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const poolTokenBalance = useAtomValue(poolTokenBalanceAtom);
  const poolTokenDecimals = useAtomValue(poolTokenDecimalsAtom);
  const tradingClient = useAtomValue(tradingClientAtom);
  const hasTpSlOrders = useAtomValue(hasTpSlOrdersAtom);
  const poolFee = useAtomValue(poolFeeAtom);
  const currencyMultiplier = useAtomValue(currencyMultiplierAtom);
  const c2s = useAtomValue(collateralToSettleConversionAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);
  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);
  const [newPositionRisk, setNewPositionRisk] = useAtom(newPositionRiskAtom);
  const [perpetualPrice, setPerpetualPrice] = useAtom(perpetualPriceAtom);
  const [collateralDeposit, setCollateralDeposit] = useAtom(collateralDepositAtom);
  const selectedPerpetualData = useAtomValue(selectedPerpetualDataAtom);

  const [isValidityCheckDone, setIsValidityCheckDone] = useState(false);
  const [showReviewOrderModal, setShowReviewOrderModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [maxOrderSize, setMaxOrderSize] = useState<{ maxBuy: number; maxSell: number }>();
  const [txHash, setTxHash] = useState<Address>();
  const [validityCheck, setValidityCheck] = useState(false);

  const requestSentRef = useRef(false);

  const { minPositionString } = useMinPositionString(currencyMultiplier, perpetualStaticInfo);

  const isPredictionMarket = selectedPerpetualData?.isPredictionMarket ?? false;

  const isMarketClosed = useMemo(() => {
    return selectedPerpetual?.isMarketClosed;
  }, [selectedPerpetual?.isMarketClosed]);

  const openReviewOrderModal = async () => {
    if (!orderInfo || !address || !traderAPI || !poolFee || !isEnabledChain(chainId)) {
      return;
    }

    setValidityCheck(true);
    setShowReviewOrderModal(true);
    setNewPositionRisk(null);
    setMaxOrderSize(undefined);

    const mainOrder = createMainOrder(orderInfo);
    const position = positions?.find((pos) => pos.symbol === orderInfo.symbol);
    const positionRiskOnTradePromise = positionRiskOnTrade(
      chainId,
      traderAPI,
      mainOrder,
      address,
      (position?.positionNotionalBaseCCY ?? 0) * (position?.side === BUY_SIDE ? 1 : -1),
      isPredictionMarket && orderInfo.tradingFee ? orderInfo.tradingFee * 1e5 : poolFee
    )
      .then((data) => {
        setNewPositionRisk(data.data.newPositionRisk);
        setCollateralDeposit(data.data.orderCost);
        let [maxLong, maxShort] = [data.data.maxLongTrade, data.data.maxShortTrade];
        const initialMarginRate = orderInfo.isPredictionMarket
          ? pmInitialMarginRate(orderInfo.orderBlock === OrderBlockE.Long ? 1 : -1, data.data.newPositionRisk.markPrice)
          : perpetualStaticInfo?.initialMarginRate;
        if (initialMarginRate && data.data.newPositionRisk.leverage > Math.floor(1 / initialMarginRate)) {
          if (orderInfo.orderBlock === OrderBlockE.Long) {
            maxLong = 0;
          } else {
            maxShort = 0;
          }
        }
        console.log({ posRiskAfter: data.data, maxLong, maxShort, position, mainOrder });
        setMaxOrderSize({ maxBuy: maxLong, maxSell: maxShort });
        setPerpetualPrice(data.data.ammPrice);
      })
      .catch(console.error);

    Promise.all([positionRiskOnTradePromise]).finally(() => {
      setValidityCheck(false);
    });
  };

  const predFeeInCC = useMemo(() => {
    if (orderInfo?.isPredictionMarket && orderInfo?.tradingFee && selectedPerpetual?.collToQuoteIndexPrice) {
      return (orderInfo.size * orderInfo.tradingFee) / selectedPerpetual.collToQuoteIndexPrice;
    }
    return undefined;
  }, [orderInfo, selectedPerpetual]);

  const closeReviewOrderModal = () => {
    setShowReviewOrderModal(false);
    setIsValidityCheckDone(false);
  };

  const isBuySellButtonActive = useMemo(() => {
    if (
      !orderInfo ||
      !address ||
      !isEnabledChain(chainId) ||
      selectedPerpetual?.state !== 'NORMAL' ||
      poolFee === undefined
    ) {
      return false;
    }
    if (!orderInfo.size || !perpetualStaticInfo?.lotSizeBC || orderInfo.size < perpetualStaticInfo.lotSizeBC) {
      return false;
    }
    if (orderInfo.orderType === OrderTypeE.Limit && (orderInfo.limitPrice === null || orderInfo.limitPrice <= 0)) {
      return false;
    }
    return !(orderInfo.orderType === OrderTypeE.Stop && (!orderInfo.triggerPrice || orderInfo.triggerPrice <= 0));
  }, [orderInfo, poolFee, address, chainId, perpetualStaticInfo?.lotSizeBC, selectedPerpetual?.state]);

  const validityCheckButtonType = useMemo(() => {
    if (isPredictionMarket && isMarketClosed) {
      return ValidityCheckButtonE.ClosedPrediction;
    }
    if (!address || !orderInfo) {
      return ValidityCheckButtonE.NoAddress;
    }
    if (!isEnabledChain(chainId)) {
      return ValidityCheckButtonE.WrongNetwork;
    }
    if (poolTokenBalance === 0) {
      return ValidityCheckButtonE.NoFunds;
    }
    if (!hasEnoughGasForFee(MethodE.Interact, 1n)) {
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
  }, [orderInfo, address, chainId, poolTokenBalance, hasEnoughGasForFee, isPredictionMarket, isMarketClosed]);

  const validityCheckButtonText = useMemo(() => {
    if (validityCheckButtonType === ValidityCheckButtonE.ClosedPrediction) {
      return `${t('common.select.market.closed')}`;
    } else if (validityCheckButtonType === ValidityCheckButtonE.NoAddress) {
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

    const orderBlock = orderInfo?.orderBlock ?? OrderBlockE.Long;
    if (isPredictionMarket) {
      return `
        ${t('pages.trade.order-block.prediction.bet')}
        ${t(predictionOrderBlockMap[orderBlock])}
      `;
    }
    return `${t(orderBlockMap[orderBlock])} ${t(orderTypeMap[orderInfo?.orderType ?? OrderTypeE.Market])}`;
  }, [t, validityCheckButtonType, orderInfo?.orderBlock, orderInfo?.orderType, isPredictionMarket]);

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
        stopPrice: orderInfo.isPredictionMarket
          ? calculatePrice(orderInfo.stopLossPrice, orderInfo.orderBlock === OrderBlockE.Short)
          : orderInfo.stopLossPrice,
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
        limitPrice: orderInfo.isPredictionMarket
          ? calculatePrice(orderInfo.takeProfitPrice, orderInfo.orderBlock === OrderBlockE.Short)
          : orderInfo.takeProfitPrice,
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
    const symbol = orderInfo?.symbol?.split('-')?.slice(0, -1)?.join('-');
    toast.success(
      <ToastContent
        title={t('pages.trade.action-block.toasts.order-submitted.title')}
        bodyLines={[
          {
            label: t('pages.trade.action-block.toasts.order-submitted.body'),
            value: symbol,
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

  const splitSymbol = selectedPool?.settleSymbol?.split('-');
  const userSymbol = `${splitSymbol?.[0]}-${splitSymbol?.[1]}-${flatToken?.isFlatToken ? flatToken.registeredSymbol : splitSymbol?.[2]}`;

  const handleOrderConfirm = () => {
    if (
      !address ||
      !walletClient ||
      !tradingClient ||
      !parsedOrders ||
      !selectedPool ||
      !proxyAddr ||
      !poolTokenDecimals ||
      !traderAPI ||
      !isEnabledChain(chainId)
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
          approveMarginToken({
            walletClient,
            settleTokenAddr: selectedPool.settleTokenAddr,
            isMultisigAddress,
            proxyAddr,
            minAmount: collateralDeposit * (c2s.get(selectedPool.poolSymbol)?.value ?? 1),
            decimals: poolTokenDecimals,
            registeredToken: flatToken?.registeredToken,
          })
            .then(() => {
              // trader doesn't need to sign if sending his own orders: signatures are dummy zero hashes
              const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
              postOrder(tradingClient, traderAPI, {
                traderAddr: address,
                orders: parsedOrders,
                signatures,
                brokerData: data.data,
                doChain: true,
              })
                .then((tx) => {
                  setShowReviewOrderModal(false);
                  // order was sent
                  clearInputsData();
                  const shortSymbol = `${parsedOrders[0].symbol.split('-')[0]}-${parsedOrders[0].symbol.split('-')[1]}`;
                  toast.success(
                    <ToastContent
                      title={t('pages.trade.action-block.toasts.processed.title')}
                      bodyLines={[{ label: 'Symbol', value: shortSymbol }]}
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
      if (perpetualStaticInfo && TraderInterface.isPredictionMarketStatic(perpetualStaticInfo)) {
        price = calculateProbability(price, orderInfo.orderBlock === OrderBlockE.Short);
      }
      return formatToCurrency(price, orderInfo.quoteCurrency);
    }
    return '-';
  }, [orderInfo, perpetualStaticInfo]);

  const positionToModify = useDebounce(
    useMemo(() => {
      return positions?.find((pos) => pos.symbol === orderInfo?.symbol);
    }, [positions, orderInfo?.symbol]),
    1_000
  );

  const validityCheckType = useMemo(() => {
    if (
      !showReviewOrderModal ||
      validityCheck ||
      !maxOrderSize ||
      !orderInfo?.orderBlock ||
      !perpetualStaticInfo?.lotSizeBC
    ) {
      return ValidityCheckE.Empty;
    }
    const isOrderTooSmall = orderInfo.size > 0 && orderInfo.size < perpetualStaticInfo.lotSizeBC;
    if (isOrderTooSmall) {
      return ValidityCheckE.OrderTooSmall;
    }
    const isPositionTooSmall =
      (!positionToModify || positionToModify.positionNotionalBaseCCY === 0) &&
      orderInfo.size < 10 * perpetualStaticInfo.lotSizeBC;
    if (isPositionTooSmall && orderInfo.orderType === OrderTypeE.Market) {
      return ValidityCheckE.PositionTooSmall;
    } else if (orderInfo.size < 10 * perpetualStaticInfo.lotSizeBC && orderInfo.orderType !== OrderTypeE.Market) {
      return ValidityCheckE.BelowMinPosition;
    }
    if (poolTokenBalance === undefined || poolTokenBalance < collateralDeposit) {
      return ValidityCheckE.InsufficientBalance;
    }
    if (orderInfo.takeProfitPrice !== null && orderInfo.takeProfitPrice <= 0) {
      return ValidityCheckE.Undefined;
    }
    if (isMarketClosed && !isPredictionMarket) {
      return ValidityCheckE.Closed;
    }
    // slippage check 1 (sign of perp price)
    let isInvalidPrice = false;
    if (orderInfo.orderType === OrderTypeE.Market && perpetualPrice !== undefined) {
      isInvalidPrice = perpetualPrice < 0;
    }
    if (isInvalidPrice) {
      return ValidityCheckE.SlippageTooLarge;
    }
    // slippage check 2 (max/min price)
    if (
      orderInfo.orderType === OrderTypeE.Market &&
      orderInfo.maxMinEntryPrice !== null &&
      perpetualPrice !== undefined // perpetualPrice is already in prob if prediction market (getPerpetualPricePromise)
    ) {
      let isSlippageTooLarge;
      if (isPredictionMarket || orderInfo.orderBlock === OrderBlockE.Long) {
        isSlippageTooLarge = orderInfo.maxMinEntryPrice < perpetualPrice;
      } else {
        isSlippageTooLarge = orderInfo.maxMinEntryPrice > perpetualPrice;
      }
      if (isSlippageTooLarge && !isPredictionMarket) {
        return ValidityCheckE.SlippageTooLarge;
      }
    }
    // size check
    let isTooLarge;
    if (orderInfo.orderBlock === OrderBlockE.Long) {
      isTooLarge = orderInfo.size > Math.abs(maxOrderSize.maxBuy);
    } else {
      isTooLarge = orderInfo.size > Math.abs(maxOrderSize.maxSell);
    }
    if (isTooLarge) {
      return ValidityCheckE.OrderTooLarge;
    }
    return ValidityCheckE.GoodToGo;
  }, [
    maxOrderSize,
    validityCheck,
    orderInfo?.size,
    orderInfo?.orderBlock,
    orderInfo?.orderType,
    orderInfo?.takeProfitPrice,
    orderInfo?.maxMinEntryPrice,
    perpetualStaticInfo,
    poolTokenBalance,
    isMarketClosed,
    collateralDeposit,
    positionToModify,
    showReviewOrderModal,
    isPredictionMarket,
    perpetualPrice,
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
    } else if (validityCheckType === ValidityCheckE.GoodToGo) {
      return '';
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

  useEffect(() => {
    clearInputsData();
  }, [clearInputsData, chainId]);

  const feePct = useMemo(() => {
    if (orderInfo?.tradingFee) {
      return (
        (orderInfo.tradingFee * 0.01) / (1 + (orderInfo.stopLossPrice ? 1 : 0) + (orderInfo.takeProfitPrice ? 1 : 0))
      );
    }
  }, [orderInfo]);

  const liqPrice =
    newPositionRisk?.liquidationPrice?.[0] && isPredictionMarket
      ? calculateProbability(newPositionRisk.liquidationPrice[0], orderInfo?.orderBlock === OrderBlockE.Short)
      : (newPositionRisk?.liquidationPrice?.[0] ?? 0);

  const isValiditySuccess = [ValidityCheckE.GoodToGo, ValidityCheckE.Closed].includes(validityCheckType);

  const userColl = userSymbol?.split('-')[2];
  const userPx = flatToken?.isFlatToken && flatToken?.compositePrice ? flatToken.compositePrice : 1;

  return (
    <div className={styles.root}>
      {[ValidityCheckButtonE.NoFunds, ValidityCheckButtonE.NoEnoughGas].includes(validityCheckButtonType) && (
        <Button variant="buy" onClick={() => setDepositModalOpen(true)} className={styles.buyButton}>
          {validityCheckButtonText}
        </Button>
      )}
      {[ValidityCheckButtonE.ClosedPrediction].includes(validityCheckButtonType) && (
        <Button variant="buy" className={styles.buyButton} disabled>
          {validityCheckButtonText}
        </Button>
      )}
      {![
        ValidityCheckButtonE.NoFunds,
        ValidityCheckButtonE.NoEnoughGas,
        ValidityCheckButtonE.ClosedPrediction,
      ].includes(validityCheckButtonType) && (
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
        <Dialog
          open={showReviewOrderModal}
          className={styles.dialog}
          onCloseClick={closeReviewOrderModal}
          dialogTitle={t('pages.trade.action-block.review.title')}
          footerActions={
            <>
              <Button onClick={closeReviewOrderModal} variant="secondary" size="small">
                {t('pages.trade.action-block.review.cancel')}
              </Button>
              <Button onClick={handleOrderConfirm} variant="primary" size="small" disabled={isConfirmButtonDisabled}>
                {t('pages.trade.action-block.review.confirm')}
              </Button>
            </>
          }
        >
          <div className={styles.newPositionHeader}>
            <Typography variant="bodyLargePopup" component="div" className={styles.orderType}>
              {orderInfo.leverage > 0 ? `${formatNumber(orderInfo.leverage)}x` : ''}{' '}
              {!isPredictionMarket && t(orderTypeMap[orderInfo.orderType])}{' '}
              {t(orderBlockMap[isPredictionMarket ? OrderBlockE.Long : orderInfo.orderBlock])}{' '}
              {isPredictionMarket && t(predictionOrderBlockMap[orderInfo.orderBlock])}
            </Typography>
            <Typography variant="bodyLargePopup" component="div" className={styles.positionPrice}>
              <DynamicLogo logoName={selectedCurrency.toLowerCase()} width={16} height={16} />
              <span>
                {orderInfo.size} {orderInfo.baseCurrency} @ {atPrice}
              </span>
            </Typography>
          </div>

          {!isPredictionMarket && (
            <div className={styles.borderedBox}>
              <div className={styles.boxContent}>
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmallPopup" className={styles.left}>
                      {' '}
                      {t('pages.trade.action-block.review.deposit')}{' '}
                    </Typography>
                  }
                  rightSide={
                    isOrderValid && collateralDeposit >= 0 && selectedPool
                      ? formatToCurrency(
                          collateralDeposit *
                            (c2s.get(selectedPool.poolSymbol)?.value ?? 1) *
                            (flatToken?.isFlatToken && flatToken?.compositePrice ? flatToken?.compositePrice : 1),
                          userSymbol?.split('-')[2]
                        )
                      : '-'
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
                      ? formatToCurrency(poolTokenBalance * userPx, userColl)
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
                        {isPredictionMarket || orderInfo.orderBlock === OrderBlockE.Long
                          ? t('pages.trade.action-block.review.max')
                          : t('pages.trade.action-block.review.min')}
                      </Typography>
                    }
                    rightSide={formatToCurrency(orderInfo.maxMinEntryPrice, orderInfo.quoteCurrency)}
                    rightSideStyles={styles.rightSide}
                  />
                )}
                {perpetualPrice !== null && (
                  <SidesRow
                    leftSide={
                      <Typography variant="bodySmallPopup" className={styles.left}>
                        {' '}
                        {t('pages.trade.action-block.review.estimated-price')}{' '}
                      </Typography>
                    }
                    rightSide={formatToCurrency(perpetualPrice, orderInfo.quoteCurrency)}
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
            </div>
          )}
          {isPredictionMarket && (
            <div className={styles.borderedBox}>
              <div className={styles.boxContent}>
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmallPopup" className={styles.left}>
                      {' '}
                      {'Margin'}{' '}
                    </Typography>
                  }
                  rightSide={
                    isOrderValid && collateralDeposit >= 0 && selectedPool
                      ? formatToCurrency(
                          Math.max(collateralDeposit - (predFeeInCC ?? 0), 0) *
                            (c2s.get(selectedPool.poolSymbol)?.value ?? 1) *
                            userPx,
                          userColl
                        )
                      : '-'
                  }
                  rightSideStyles={styles.rightSide}
                />
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmallPopup" className={styles.left}>
                      {' '}
                      {t('common.cost-of-order')}{' '}
                    </Typography>
                  }
                  rightSide={
                    predFeeInCC && userSymbol ? formatToCurrency(predFeeInCC * userPx, userColl, false, 2) : '-'
                  }
                  rightSideStyles={styles.rightSide}
                />
                {perpetualPrice !== null && (
                  <SidesRow
                    leftSide={
                      <Typography variant="bodySmallPopup" className={styles.left}>
                        {' '}
                        {t('pages.trade.action-block.review.estimated-price')}{' '}
                      </Typography>
                    }
                    rightSide={formatToCurrency(perpetualPrice, orderInfo.quoteCurrency)}
                    rightSideStyles={styles.rightSide}
                  />
                )}
              </div>
            </div>
          )}

          {!isPredictionMarket && (
            <div className={styles.borderedBox}>
              <div className={styles.boxContent}>
                <Typography variant="bodyMediumPopup" component="div" className={styles.heading}>
                  <WalletContentIcon width={14} height={14} />
                  <span>{t('pages.trade.action-block.review.details')}</span>
                </Typography>
                <Typography variant="bodyMediumPopup" component="div" className={styles.positionSize}>
                  <DynamicLogo logoName={selectedCurrency.toLowerCase()} width={16} height={16} />
                  <span>
                    {isOrderValid && newPositionRisk
                      ? formatToCurrency(newPositionRisk.positionNotionalBaseCCY, orderInfo.baseCurrency)
                      : '-'}
                  </span>
                </Typography>
              </div>
              <Separator separatorType={SeparatorTypeE.Modal} lineClassName={styles.separator} />
              <div className={styles.boxContent}>
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmallPopup" className={styles.left}>
                      {' '}
                      {t('pages.trade.action-block.review.margin')}{' '}
                    </Typography>
                  }
                  rightSide={
                    isOrderValid && newPositionRisk && newPositionRisk.collateralCC >= 0 && selectedPool
                      ? formatToCurrency(
                          newPositionRisk.collateralCC * (c2s.get(selectedPool.poolSymbol)?.value ?? 1) * userPx,
                          userColl
                        )
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
                    isOrderValid &&
                    newPositionRisk &&
                    newPositionRisk.leverage > 0 &&
                    newPositionRisk.leverage < Infinity
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
                    isOrderValid && newPositionRisk && liqPrice > 0 && liqPrice < Infinity
                      ? formatToCurrency(liqPrice ?? 0, orderInfo.quoteCurrency)
                      : '-'
                  }
                  rightSideStyles={styles.rightSide}
                />
              </div>
            </div>
          )}
          {isPredictionMarket && (
            <div className={styles.borderedBox}>
              <div className={styles.boxContent}>
                <Typography variant="bodyMediumPopup" component="div" className={styles.heading2}>
                  {t('pages.trade.action-block.review.prediction-header')}
                </Typography>
                <Typography variant="bodySmallPopup" component="div" className={styles.contentText}>
                  {t('pages.trade.action-block.review.prediction-content', {
                    predFeeInCC: formatToCurrency(predFeeInCC, selectedPool?.settleSymbol, false, 2),
                    collateralDeposit: formatToCurrency(
                      Math.max(collateralDeposit - (predFeeInCC || 0), 0),
                      selectedPool?.settleSymbol
                    ),
                    costs: formatToCurrency(
                      orderInfo.size *
                        calculateProbability(orderInfo.midPrice, orderInfo.orderBlock === OrderBlockE.Short),
                      selectedPool?.settleSymbol,
                      false,
                      2
                    ),
                  })}
                </Typography>
              </div>
            </div>
          )}

          <div
            className={classnames(styles.borderedBox, styles.emphasis, {
              [styles.success]: isValidityCheckDone && isValiditySuccess,
              [styles.error]: isValidityCheckDone && !isValiditySuccess,
            })}
          >
            <div className={styles.boxContent}>
              <Typography variant="bodyMediumPopup" className={styles.semibold}>
                {isValidityCheckDone &&
                  (isValiditySuccess ? (
                    <ActionSuccessIcon width={18} height={18} />
                  ) : (
                    <ActionErrorIcon width={18} height={18} />
                  ))}
                {t('pages.trade.action-block.review.validity-checks')}:{' '}
                {!isValidityCheckDone && <CircularProgress color="primary" size="16px" />}
                {isValidityCheckDone &&
                  (validityCheckType !== ValidityCheckE.Empty
                    ? t(
                        `pages.trade.action-block.validity.${
                          [ValidityCheckE.GoodToGo, ValidityCheckE.Closed].includes(validityCheckType) ? 'pass' : 'fail'
                        }`
                      )
                    : ' ')}
                {isValidityCheckDone && validityCheckText !== '' && (
                  <div className={styles.errorDetails}>{validityCheckText}</div>
                )}
              </Typography>
            </div>
          </div>
          {hasTpSlOrders && (
            <Typography
              variant="bodySmallPopup"
              className={styles.tpSlNote}
              style={{ color: 'var(--d8x-color-warning-secondary)' }}
            >
              {t('pages.trade.action-block.validity.verify-tp-sl-orders')}
            </Typography>
          )}
        </Dialog>
      )}
    </div>
  );
});

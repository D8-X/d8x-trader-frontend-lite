import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useChainId } from 'wagmi';

import { ToastContent } from 'components/toast-content/ToastContent';
import { parseSymbol } from 'helpers/parseSymbol';
import { getOpenOrders } from 'network/network';
import {
  allPerpetualStatisticsAtom,
  executeOrderAtom,
  failOrderAtom,
  failOrderIdAtom,
  mainWsLatestMessageTimeAtom,
  openOrdersAtom,
  perpetualStatisticsAtom,
  removeOpenOrderAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
  triggerBalancesUpdateAtom,
  triggerPositionsUpdateAtom,
  webSocketReadyAtom,
} from 'store/pools.store';
import { PerpetualStatisticsI } from 'types/types';
import { debounceLeading } from 'utils/debounceLeading';

import {
  CommonWsMessageI,
  ConnectWsMessageI,
  MessageTypeE,
  OnExecutionFailedWsMessageI,
  OnLimitOrderCreatedWsMessageI,
  OnPerpetualLimitOrderCancelledWsMessageI,
  OnTradeWsMessageI,
  OnUpdateMarginAccountWsMessageI,
  OnUpdateMarkPriceWsMessageI,
  SubscriptionWsMessageI,
} from './types';

function isConnectMessage(message: CommonWsMessageI): message is ConnectWsMessageI {
  return message.type === MessageTypeE.Connect;
}

function isSubscriptionMessage(message: CommonWsMessageI): message is SubscriptionWsMessageI {
  return message.type === MessageTypeE.Subscription;
}

function isUpdateMarkPriceMessage(message: CommonWsMessageI): message is OnUpdateMarkPriceWsMessageI {
  return message.type === MessageTypeE.OnUpdateMarkPrice;
}

function isUpdateMarginAccountMessage(message: CommonWsMessageI): message is OnUpdateMarginAccountWsMessageI {
  return message.type === MessageTypeE.OnUpdateMarginAccount;
}

function isPerpetualLimitOrderCancelledMessage(
  message: CommonWsMessageI
): message is OnPerpetualLimitOrderCancelledWsMessageI {
  return message.type === MessageTypeE.OnPerpetualLimitOrderCancelled;
}

function isTradeMessage(message: CommonWsMessageI): message is OnTradeWsMessageI {
  return message.type === MessageTypeE.OnTrade;
}

function isLimitOrderCreatedMessage(message: CommonWsMessageI): message is OnLimitOrderCreatedWsMessageI {
  return message.type === MessageTypeE.OnPerpetualLimitOrderCreated;
}

function isExecutionFailedMessage(message: CommonWsMessageI): message is OnExecutionFailedWsMessageI {
  return message.type === MessageTypeE.OnExecutionFailed;
}

let allPerpetualStatisticsUpdates: Record<string, PerpetualStatisticsI> = {};
const debouncePerpetualStatistics = debounceLeading((callback: () => void) => {
  callback();
}, 5000);

const debounceLatestMessageTime = debounceLeading((callback: () => void) => {
  callback();
}, 1000);

export function useWsMessageHandler() {
  const { t } = useTranslation();
  const { address } = useAccount();
  const chainId = useChainId();

  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const setWebSocketReady = useSetAtom(webSocketReadyAtom);
  const setMainWsLatestMessageTime = useSetAtom(mainWsLatestMessageTimeAtom);
  const setPerpetualStatistics = useSetAtom(perpetualStatisticsAtom);
  const setOpenOrders = useSetAtom(openOrdersAtom);
  const removeOpenOrder = useSetAtom(removeOpenOrderAtom);
  const failOpenOrder = useSetAtom(failOrderAtom);
  const setAllPerpetualStatistics = useSetAtom(allPerpetualStatisticsAtom);
  const setTriggerPositionsUpdate = useSetAtom(triggerPositionsUpdateAtom);
  const setTriggerBalancesUpdate = useSetAtom(triggerBalancesUpdateAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const [executedOrders, setOrderExecuted] = useAtom(executeOrderAtom);
  const [failedOrderIds, setOrderIdFailed] = useAtom(failOrderIdAtom);

  const updatePerpetualStats = useCallback(
    (stats: PerpetualStatisticsI) => {
      if (selectedPool && selectedPerpetual) {
        if (
          stats.baseCurrency === selectedPerpetual.baseCurrency &&
          stats.quoteCurrency === selectedPerpetual.quoteCurrency &&
          stats.poolName === selectedPool.poolSymbol
        ) {
          if (Math.abs(stats.currentFundingRateBps) < 1e-6) {
            // update does not contain funding rate/open interest - keep current values
            setPerpetualStatistics({
              ...stats,
              currentFundingRateBps: selectedPerpetual.currentFundingRateBps,
              openInterestBC: selectedPerpetual.openInterestBC,
            });
          } else {
            // update all
            setPerpetualStatistics(stats);
          }
        }
      }
    },
    [selectedPool, selectedPerpetual, setPerpetualStatistics]
  );

  return useCallback(
    (message: string) => {
      const parsedMessage = JSON.parse(message);

      debounceLatestMessageTime(() => {
        setMainWsLatestMessageTime(Date.now());
      });

      if (isConnectMessage(parsedMessage)) {
        setWebSocketReady(true);
      } else if (isSubscriptionMessage(parsedMessage)) {
        const parsedSymbol = parseSymbol(parsedMessage.msg);
        if (!parsedSymbol) {
          return;
        }

        updatePerpetualStats({
          id: parsedMessage.data.id,
          baseCurrency: parsedMessage.data.baseCurrency,
          quoteCurrency: parsedMessage.data.quoteCurrency,
          poolName: parsedSymbol.poolSymbol,
          midPrice: parsedMessage.data.midPrice,
          markPrice: parsedMessage.data.markPrice,
          indexPrice: parsedMessage.data.indexPrice,
          currentFundingRateBps: parsedMessage.data.currentFundingRateBps,
          openInterestBC: parsedMessage.data.openInterestBC,
        });
      } else if (isUpdateMarkPriceMessage(parsedMessage)) {
        const parsedSymbol = parseSymbol(parsedMessage.data.obj.symbol);
        if (!parsedSymbol) {
          return;
        }

        const {
          perpetualId: id,
          midPrice,
          markPrice,
          indexPrice,
          fundingRate: currentFundingRateBps,
          openInterest: openInterestBC,
        } = parsedMessage.data.obj;

        const perpetualStats = {
          id,
          baseCurrency: parsedSymbol.baseCurrency,
          quoteCurrency: parsedSymbol.quoteCurrency,
          poolName: parsedSymbol.poolSymbol,
          midPrice,
          markPrice,
          indexPrice,
          currentFundingRateBps,
          openInterestBC,
        };

        updatePerpetualStats(perpetualStats);

        allPerpetualStatisticsUpdates[parsedMessage.data.obj.symbol] = perpetualStats;
        debouncePerpetualStatistics(() => {
          setAllPerpetualStatistics(allPerpetualStatisticsUpdates);
          allPerpetualStatisticsUpdates = {};
        });
      } else if (isUpdateMarginAccountMessage(parsedMessage)) {
        if (!address || address !== parsedMessage.data.obj.traderAddr) {
          return;
        }

        setTriggerPositionsUpdate((prevValue) => !prevValue);
      } else if (isLimitOrderCreatedMessage(parsedMessage)) {
        if (!address || address !== parsedMessage.data.obj.traderAddr) {
          return;
        }
        // refresh open orders
        getOpenOrders(chainId, traderAPI, address)
          .then(({ data }) => {
            if (data?.length > 0) {
              data.map(setOpenOrders);
            }
            setTriggerBalancesUpdate((prevValue) => !prevValue);
          })
          .catch(console.error);
      } else if (isPerpetualLimitOrderCancelledMessage(parsedMessage)) {
        removeOpenOrder(parsedMessage.data.obj.orderId);
      } else if (isTradeMessage(parsedMessage)) {
        if (!address || address !== parsedMessage.data.obj.traderAddr) {
          return;
        }
        const orderId = parsedMessage.data.obj.orderId;
        removeOpenOrder(orderId);
        if (!executedOrders.has(orderId)) {
          setOrderExecuted(orderId);
          toast.success(
            <ToastContent
              title={t('pages.trade.positions-table.toasts.trade-executed.title')}
              bodyLines={[
                {
                  label: t('pages.trade.positions-table.toasts.trade-executed.body'),
                  value: parsedMessage.data.obj.symbol,
                },
              ]}
            />
          );
        }
      } else if (isExecutionFailedMessage(parsedMessage)) {
        if (!address || address !== parsedMessage.data.obj.traderAddr) {
          return;
        }
        const orderId = parsedMessage.data.obj.orderId;
        failOpenOrder(orderId);
        if (!failedOrderIds.has(orderId)) {
          setOrderIdFailed(orderId);
          toast.error(
            <ToastContent
              title={t('pages.trade.positions-table.toasts.order-failed.title')}
              bodyLines={[
                {
                  label: t('pages.trade.positions-table.toasts.order-failed.body1'),
                  value: parsedMessage.data.obj.symbol,
                },
                {
                  label: t('pages.trade.positions-table.toasts.order-failed.body2'),
                  value: parsedMessage.data.obj.reason,
                },
              ]}
            />
          );
        }
      }
    },
    [
      updatePerpetualStats,
      setWebSocketReady,
      setTriggerPositionsUpdate,
      setTriggerBalancesUpdate,
      setOpenOrders,
      removeOpenOrder,
      failOpenOrder,
      setAllPerpetualStatistics,
      setMainWsLatestMessageTime,
      setOrderExecuted,
      setOrderIdFailed,
      executedOrders,
      failedOrderIds,
      chainId,
      address,
      t,
      traderAPI,
    ]
  );
}

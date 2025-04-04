import { OrderStatus } from '@d8x/perpetuals-sdk';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount } from 'wagmi';

import { ToastContent } from 'components/toast-content/ToastContent';
import { getOpenOrders, getPositionRisk } from 'network/network';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import {
  cancelOrderIdAtom,
  clearOpenOrdersAtom,
  clearPositionsAtom,
  executeOrderAtom,
  failOrderIdAtom,
  fundingListAtom,
  openOrdersAtom,
  positionsAtom,
  traderAPIAtom,
  tradesHistoryAtom,
  triggerBalancesUpdateAtom,
} from 'store/pools.store';
import type { PerpetualOpenOrdersI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';
import { isExecuted } from 'blockchain-api/isExecuted';
import { Address } from 'viem';

const MAX_FETCH_COUNT = 20;
const MAX_FETCH_TIME = 40_000; // 40 sec
const INTERVAL_FOR_TICKER_FAST = 4000;
const INTERVAL_FOR_TICKER_SLOW = 120000;

export const TableDataFetcher = memo(() => {
  const { t } = useTranslation();

  const { address, chainId, isDisconnected } = useAccount();

  const latestOrderSentTimestamp = useAtomValue(latestOrderSentTimestampAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const cancelledOrderIds = useAtomValue(cancelOrderIdAtom);
  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const [executedOrders, setOrderExecuted] = useAtom(executeOrderAtom);
  const [failedOrderIds, setOrderFailed] = useAtom(failOrderIdAtom);
  const setTriggerBalancesUpdate = useSetAtom(triggerBalancesUpdateAtom);
  const clearOpenOrders = useSetAtom(clearOpenOrdersAtom);
  const clearPositions = useSetAtom(clearPositionsAtom);
  const setPositions = useSetAtom(positionsAtom);
  const setFundingList = useSetAtom(fundingListAtom);
  const setTradesHistory = useSetAtom(tradesHistoryAtom);

  const [fastTicker, setFastTicker] = useState(0);
  const [slowTicker, setSlowTicker] = useState(0);
  const [lastFetch, setLastFetch] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (Date.now() - latestOrderSentTimestamp <= MAX_FETCH_TIME) {
      setFastTicker(1);
      intervalId = setInterval(() => {
        setFastTicker((prevState) => {
          if (prevState >= MAX_FETCH_COUNT) {
            clearInterval(intervalId);
            return 0;
          }
          return prevState + 1;
        });
      }, INTERVAL_FOR_TICKER_FAST);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [latestOrderSentTimestamp]);

  useEffect(() => {
    if (isDisconnected || !isEnabledChain(chainId)) {
      clearOpenOrders();
      clearPositions();
      setFundingList([]);
      setTradesHistory([]);
    }
  }, [isDisconnected, chainId, clearOpenOrders, clearPositions, setFundingList, setTradesHistory, traderAPI]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSlowTicker((prevState) => {
        return prevState + 1;
      });
    }, INTERVAL_FOR_TICKER_SLOW);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleRemovedOrders = useCallback(
    async (newOrderInfo: PerpetualOpenOrdersI[]) => {
      if (newOrderInfo.length < 1 || !traderAPI) {
        return;
      }
      for (const order of openOrders) {
        if (!newOrderInfo.some(({ orderIds }) => orderIds.some((orderId) => order.id === orderId))) {
          const orderStatus = await traderAPI.getOrderStatus(order.symbol, order.id);
          if (orderStatus === OrderStatus.EXECUTED && !executedOrders.has(order.id)) {
            setOrderExecuted(order.id);
            toast.success(
              <ToastContent
                title={t('pages.trade.positions-table.toasts.trade-executed.title')}
                bodyLines={[
                  {
                    label: t('pages.trade.positions-table.toasts.trade-executed.body'),
                    value: order.symbol.split('-').slice(0, -1).join('-'),
                  },
                ]}
              />
            );
          } else if (
            !executedOrders.has(order.id) &&
            !cancelledOrderIds.has(order.id) &&
            !failedOrderIds.has(order.id)
          ) {
            const proxyAddr = traderAPI?.getProxyAddress() as Address;
            if (proxyAddr) {
              isExecuted(proxyAddr, order.id).then(({ isCancelled }) => {
                if (!isCancelled) {
                  setOrderFailed(order.id);
                  toast.error(
                    <ToastContent
                      title={t('pages.trade.positions-table.toasts.trade-failed.title')}
                      bodyLines={[
                        {
                          label: t('pages.trade.positions-table.toasts.trade-executed.body'),
                          value: order.symbol.split('-').slice(0, -1).join('-'),
                        },
                        {
                          label: t('pages.trade.positions-table.toasts.trade-failed.body'),
                          value: '',
                        },
                      ]}
                    />
                  );
                }
              });
            }
          }
        }
      }
    },
    [executedOrders, failedOrderIds, cancelledOrderIds, t, openOrders, traderAPI, setOrderExecuted, setOrderFailed]
  );

  useEffect(() => {
    if (Date.now() - lastFetch < INTERVAL_FOR_TICKER_FAST) {
      return;
    }
    if ((fastTicker > 0 || slowTicker > 0) && isEnabledChain(chainId) && address) {
      setLastFetch(Date.now());
      setTriggerBalancesUpdate((prevValue) => !prevValue);
      getOpenOrders(chainId, traderAPI, address)
        .then(({ data: d }) => {
          handleRemovedOrders(d).then();
          clearOpenOrders();
          if (d?.length > 0) {
            d.map(setOpenOrders);
          }
        })
        .catch(console.error);
      getPositionRisk(chainId, traderAPI, address, Date.now())
        .then(({ data }) => {
          if (data && data.length > 0) {
            data.map(setPositions);
          }
        })
        .catch(console.error);
    }
  }, [
    slowTicker,
    fastTicker,
    chainId,
    traderAPI,
    address,
    lastFetch,
    handleRemovedOrders,
    setTriggerBalancesUpdate,
    setPositions,
    setOpenOrders,
    clearOpenOrders,
  ]);

  return null;
});

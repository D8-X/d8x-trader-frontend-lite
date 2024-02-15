import { useAtom, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useState } from 'react';
import { type Address, useAccount, useChainId } from 'wagmi';

import { getOpenOrders, getPositionRisk } from 'network/network';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import {
  clearOpenOrdersAtom,
  executeOrderAtom,
  failOrderIdAtom,
  openOrdersAtom,
  positionsAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { PerpetualOpenOrdersI } from 'types/types';
import { OrderStatus } from '@d8x/perpetuals-sdk';
import { toast } from 'react-toastify';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useTranslation } from 'react-i18next';

const MAX_FETCH_COUNT = 20;
const MAX_FETCH_TIME = 40 * 1000;
const INTERVAL_FOR_TICKER_FAST = 2000;
const INTERVAL_FOR_TICKER_SLOW = 120000;

export const TableDataFetcher = memo(() => {
  const { t } = useTranslation();
  const { address } = useAccount();
  const chainId = useChainId();

  const [latestOrderSentTimestamp] = useAtom(latestOrderSentTimestampAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const [executedOrders, setOrderExecuted] = useAtom(executeOrderAtom);
  const [failedOrderIds, setOrderIdFailed] = useAtom(failOrderIdAtom);

  const clearOpenOrders = useSetAtom(clearOpenOrdersAtom);
  const setPositions = useSetAtom(positionsAtom);

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
    setInterval(() => {
      setSlowTicker((prevState) => {
        return prevState + 1;
      });
    }, INTERVAL_FOR_TICKER_SLOW);
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
                    value: order.symbol,
                  },
                ]}
              />
            );
          }
          if (orderStatus === OrderStatus.CANCELED && !failedOrderIds.has(order.id)) {
            setOrderIdFailed(order.id);
            toast.error(
              <ToastContent
                title={t('pages.trade.positions-table.toasts.order-failed.title')}
                bodyLines={[
                  {
                    label: t('pages.trade.positions-table.toasts.order-failed.body1'),
                    value: order.symbol,
                  },
                ]}
              />
            );
          }
        }
      }
    },
    [executedOrders, failedOrderIds, t, openOrders, traderAPI, setOrderExecuted, setOrderIdFailed]
  );

  useEffect(() => {
    if (Date.now() - lastFetch < INTERVAL_FOR_TICKER_FAST) {
      return;
    }
    if ((fastTicker > 0 || slowTicker > 0) && chainId && address) {
      setLastFetch(Date.now());
      getOpenOrders(chainId, traderAPI, address as Address)
        .then(({ data: d }) => {
          handleRemovedOrders(d).then();
          clearOpenOrders();
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
    }
  }, [
    slowTicker,
    fastTicker,
    chainId,
    traderAPI,
    address,
    lastFetch,
    handleRemovedOrders,
    setPositions,
    setOpenOrders,
    clearOpenOrders,
  ]);

  return null;
});

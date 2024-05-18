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
  clearOpenOrdersAtom,
  clearPositionsAtom,
  executeOrderAtom,
  openOrdersAtom,
  positionsAtom,
  traderAPIAtom,
  triggerBalancesUpdateAtom,
} from 'store/pools.store';
import type { PerpetualOpenOrdersI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

const MAX_FETCH_COUNT = 20;
const MAX_FETCH_TIME = 40_000; // 40 sec
const INTERVAL_FOR_TICKER_FAST = 4000;
const INTERVAL_FOR_TICKER_SLOW = 120000;

export const TableDataFetcher = memo(() => {
  const { t } = useTranslation();

  const { address, chainId, isDisconnected } = useAccount();

  const latestOrderSentTimestamp = useAtomValue(latestOrderSentTimestampAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const [executedOrders, setOrderExecuted] = useAtom(executeOrderAtom);
  const setTriggerBalancesUpdate = useSetAtom(triggerBalancesUpdateAtom);
  const clearOpenOrders = useSetAtom(clearOpenOrdersAtom);
  const clearPositions = useSetAtom(clearPositionsAtom);
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
    if (isDisconnected || !traderAPI || traderAPI.chainId !== chainId || !isEnabledChain(chainId)) {
      clearOpenOrders();
      clearPositions();
    }
  }, [isDisconnected, chainId, clearOpenOrders, clearPositions, traderAPI]);

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
                    value: order.symbol,
                  },
                ]}
              />
            );
          }
        }
      }
    },
    [executedOrders, t, openOrders, traderAPI, setOrderExecuted]
  );

  useEffect(() => {
    if (Date.now() - lastFetch < INTERVAL_FOR_TICKER_FAST) {
      return;
    }
    if ((fastTicker > 0 || slowTicker > 0) && traderAPI && chainId && isEnabledChain(chainId) && address) {
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

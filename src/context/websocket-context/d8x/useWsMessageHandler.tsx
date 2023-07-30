import { useAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useChainId } from 'wagmi';

import { ToastContent } from 'components/toast-content/ToastContent';
import { parseSymbol } from 'helpers/parseSymbol';
import {
  failOrderAtom,
  openOrdersAtom,
  perpetualStatisticsAtom,
  positionsAtom,
  removeOpenOrderAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
  webSocketReadyAtom,
} from 'store/pools.store';
import { PerpetualStatisticsI } from 'types/types';

import {
  CommonWsMessageI,
  ConnectWsMessageI,
  // ErrorWsMessageI,
  MessageTypeE,
  OnExecutionFailedWsMessageI,
  OnLimitOrderCreatedWsMessageI,
  OnPerpetualLimitOrderCancelledWsMessageI,
  OnTradeWsMessageI,
  OnUpdateMarginAccountWsMessageI,
  OnUpdateMarkPriceWsMessageI,
  SubscriptionWsMessageI,
} from './types';
import { getOpenOrders } from 'network/network';

function isConnectMessage(message: CommonWsMessageI): message is ConnectWsMessageI {
  return message.type === MessageTypeE.Connect;
}

// function isErrorMessage(message: CommonWsMessageI): message is ErrorWsMessageI {
//   return message.type === MessageTypeE.Error;
// }

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

export function useWsMessageHandler() {
  const { address } = useAccount();
  const chainId = useChainId();

  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [, setWebSocketReady] = useAtom(webSocketReadyAtom);
  const [, setPerpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const [, setPositions] = useAtom(positionsAtom);
  const [, setOpenOrders] = useAtom(openOrdersAtom);
  const [, removeOpenOrder] = useAtom(removeOpenOrderAtom);
  const [, failOpenOrder] = useAtom(failOrderAtom);
  const [traderAPI] = useAtom(traderAPIAtom);

  const traderAPIRef = useRef(traderAPI);

  const updatePerpetualStats = useCallback(
    (stats: PerpetualStatisticsI) => {
      if (selectedPool && selectedPerpetual) {
        if (
          stats.baseCurrency === selectedPerpetual.baseCurrency &&
          stats.quoteCurrency === selectedPerpetual.quoteCurrency &&
          stats.poolName === selectedPool.poolSymbol
        ) {
          setPerpetualStatistics(stats);
        }
      }
    },
    [selectedPool, selectedPerpetual, setPerpetualStatistics]
  );

  return useCallback(
    (message: string) => {
      const parsedMessage = JSON.parse(message);

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

        updatePerpetualStats({
          id,
          baseCurrency: parsedSymbol.baseCurrency,
          quoteCurrency: parsedSymbol.quoteCurrency,
          poolName: parsedSymbol.poolSymbol,
          midPrice,
          markPrice,
          indexPrice,
          currentFundingRateBps,
          openInterestBC,
        });
      } else if (isUpdateMarginAccountMessage(parsedMessage)) {
        if (!address || address !== parsedMessage.data.obj.traderAddr) {
          return;
        }

        setPositions(parsedMessage.data.obj);
      } else if (isLimitOrderCreatedMessage(parsedMessage)) {
        if (!address || address !== parsedMessage.data.obj.traderAddr) {
          return;
        }
        // refresh open orders
        getOpenOrders(chainId, traderAPIRef.current, parsedMessage.data.obj.symbol, address)
          .then(({ data }) => {
            if (data && data.length > 0) {
              data.map((o) => setOpenOrders(o));
            }
          })
          .catch(console.error);
      } else if (isPerpetualLimitOrderCancelledMessage(parsedMessage)) {
        removeOpenOrder(parsedMessage.data.obj.orderId);
      } else if (isTradeMessage(parsedMessage)) {
        if (!address || address !== parsedMessage.data.obj.traderAddr) {
          return;
        }
        removeOpenOrder(parsedMessage.data.obj.orderId);
        toast.success(
          <ToastContent
            title="Trade executed"
            bodyLines={[{ label: 'Symbol', value: parsedMessage.data.obj.symbol }]}
          />
        );
      } else if (isExecutionFailedMessage(parsedMessage)) {
        if (!address || address !== parsedMessage.data.obj.traderAddr) {
          return;
        }
        failOpenOrder(parsedMessage.data.obj.orderId);
        toast.error(
          <ToastContent
            title="Order failed"
            bodyLines={[
              { label: 'Symbol', value: parsedMessage.data.obj.symbol },
              { label: 'Reason', value: parsedMessage.data.obj.reason },
            ]}
          />
        );
      }
    },
    [
      updatePerpetualStats,
      setWebSocketReady,
      setPositions,
      setOpenOrders,
      removeOpenOrder,
      failOpenOrder,
      chainId,
      address,
    ]
  );
}

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';

import { calculateProbability } from 'helpers/calculateProbability';
import { orderInfoAtom, stopLossAtom, stopLossInputPriceAtom, stopLossPriceAtom } from 'store/order-block.store';
import { traderAPIAtom } from 'store/pools.store';
import { OrderBlockE, StopLossE } from 'types/enums';

export const useStopLoss = () => {
  const traderAPI = useAtomValue(traderAPIAtom);
  const orderInfo = useAtomValue(orderInfoAtom);
  const setStopLossPrice = useSetAtom(stopLossPriceAtom);
  const setStopLoss = useSetAtom(stopLossAtom);
  const [stopLossInputPrice, setStopLossInputPrice] = useAtom(stopLossInputPriceAtom);

  const handleStopLossPriceChange = (stopLossPriceValue: string) => {
    if (stopLossPriceValue !== '') {
      setStopLossInputPrice(+stopLossPriceValue);
      setStopLoss(null);
    } else {
      setStopLossInputPrice(null);
    }
  };

  const handleStopLossChange = (stopLossValue: StopLossE) => {
    setStopLossPrice(null);
    setStopLossInputPrice(null);
    setStopLoss(stopLossValue);
  };

  const [midPrice, isPredictionMarket] = useMemo(() => {
    if (!!traderAPI && !!orderInfo) {
      try {
        const predMarket = traderAPI?.isPredictionMarket(orderInfo.symbol);
        return [
          predMarket
            ? calculateProbability(orderInfo.midPrice, orderInfo.orderBlock === OrderBlockE.Short)
            : orderInfo.midPrice,
          predMarket,
        ];
      } catch (error) {
        // skip
      }
    }
    return [orderInfo?.midPrice, false];
  }, [orderInfo, traderAPI]);

  const minStopLossPrice = useMemo(() => {
    if (midPrice === undefined) {
      return 0.000000001;
    }
    if (orderInfo?.orderBlock === OrderBlockE.Short) {
      return isPredictionMarket ? midPrice - midPrice / orderInfo.leverage : midPrice;
    } else if (orderInfo?.leverage) {
      return Math.max(0.000000001, midPrice - midPrice / orderInfo.leverage);
    }
    return 0.000000001;
  }, [orderInfo?.orderBlock, orderInfo?.leverage, midPrice, isPredictionMarket]);

  const maxStopLossPrice = useMemo(() => {
    if (typeof midPrice === 'number' && orderInfo?.orderBlock === OrderBlockE.Long) {
      return midPrice;
    } else if (typeof midPrice === 'number' && orderInfo?.leverage) {
      return isPredictionMarket ? midPrice : midPrice + midPrice / orderInfo.leverage;
    }
  }, [orderInfo?.orderBlock, orderInfo?.leverage, midPrice, isPredictionMarket]);

  const validateStopLossPrice = useCallback(() => {
    if (stopLossInputPrice === null) {
      setStopLossPrice(null);
      setStopLoss(StopLossE.None);
      return;
    }

    if (maxStopLossPrice && stopLossInputPrice > maxStopLossPrice) {
      const maxStopLossPriceRounded = +maxStopLossPrice;
      setStopLossPrice(maxStopLossPriceRounded);
      setStopLossInputPrice(maxStopLossPriceRounded);
      return;
    }
    if (stopLossInputPrice < minStopLossPrice) {
      const minStopLossPriceRounded = +minStopLossPrice;
      setStopLossPrice(minStopLossPriceRounded);
      setStopLossInputPrice(minStopLossPriceRounded);
      return;
    }

    setStopLossPrice(stopLossInputPrice);
  }, [minStopLossPrice, maxStopLossPrice, stopLossInputPrice, setStopLoss, setStopLossPrice, setStopLossInputPrice]);

  return {
    handleStopLossPriceChange,
    handleStopLossChange,
    validateStopLossPrice,
    midPrice,
  };
};

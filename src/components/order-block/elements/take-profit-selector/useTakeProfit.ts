import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';

import { calculateProbability } from 'helpers/calculateProbability';
import { orderInfoAtom, takeProfitAtom, takeProfitInputPriceAtom, takeProfitPriceAtom } from 'store/order-block.store';
import { traderAPIAtom } from 'store/pools.store';
import { OrderBlockE, TakeProfitE } from 'types/enums';

export const useTakeProfit = () => {
  const traderAPI = useAtomValue(traderAPIAtom);
  const orderInfo = useAtomValue(orderInfoAtom);
  const setTakeProfitPrice = useSetAtom(takeProfitPriceAtom);
  const setTakeProfit = useSetAtom(takeProfitAtom);
  const [takeProfitInputPrice, setTakeProfitInputPrice] = useAtom(takeProfitInputPriceAtom);

  const handleTakeProfitPriceChange = (takeProfitPriceValue: string) => {
    if (takeProfitPriceValue !== '') {
      setTakeProfitInputPrice(+takeProfitPriceValue);
      setTakeProfit(null);
    } else {
      setTakeProfitInputPrice(null);
    }
  };

  const handleTakeProfitChange = (takeProfitValue: TakeProfitE) => {
    setTakeProfitPrice(null);
    setTakeProfitInputPrice(null);
    setTakeProfit(takeProfitValue);
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

  const minTakeProfitPrice = useMemo(() => {
    if (midPrice && orderInfo?.orderBlock === OrderBlockE.Long) {
      return midPrice;
    } else if (midPrice && orderInfo?.orderBlock === OrderBlockE.Short) {
      return isPredictionMarket ? midPrice : 0.000000001;
    }
    return 0.000000001;
  }, [midPrice, orderInfo?.orderBlock, isPredictionMarket]);

  const maxTakeProfitPrice = useMemo(() => {
    if (midPrice && orderInfo?.orderBlock === OrderBlockE.Short) {
      return isPredictionMarket ? undefined : midPrice;
    }
    return undefined;
  }, [midPrice, orderInfo?.orderBlock, isPredictionMarket]);

  const validateTakeProfitPrice = useCallback(() => {
    if (takeProfitInputPrice === null) {
      setTakeProfitPrice(null);
      setTakeProfit(TakeProfitE.None);
      return;
    }

    if (maxTakeProfitPrice && takeProfitInputPrice > maxTakeProfitPrice) {
      const maxTakeProfitPriceRounded = +maxTakeProfitPrice;
      setTakeProfitPrice(maxTakeProfitPriceRounded);
      setTakeProfitInputPrice(maxTakeProfitPriceRounded);
      return;
    }
    if (takeProfitInputPrice < minTakeProfitPrice) {
      const minTakeProfitPriceRounded = +minTakeProfitPrice;
      setTakeProfitPrice(minTakeProfitPriceRounded);
      setTakeProfitInputPrice(minTakeProfitPriceRounded);
      return;
    }

    setTakeProfitPrice(takeProfitInputPrice);
  }, [
    minTakeProfitPrice,
    maxTakeProfitPrice,
    takeProfitInputPrice,
    setTakeProfit,
    setTakeProfitPrice,
    setTakeProfitInputPrice,
  ]);

  return {
    handleTakeProfitPriceChange,
    handleTakeProfitChange,
    validateTakeProfitPrice,
    midPrice,
  };
};

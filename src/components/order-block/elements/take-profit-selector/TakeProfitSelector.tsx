import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { CustomPriceSelector } from 'components/custom-price-selector/CustomPriceSelector';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { calculateProbability } from 'helpers/calculateProbability';
import { orderInfoAtom, takeProfitAtom, takeProfitPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, traderAPIAtom } from 'store/pools.store';
import { OrderBlockE, OrderTypeE, TakeProfitE } from 'types/enums';
import { valueToFractionDigits } from 'utils/formatToCurrency';

export const TakeProfitSelector = memo(() => {
  const { t } = useTranslation();
  const traderAPI = useAtomValue(traderAPIAtom);

  const orderInfo = useAtomValue(orderInfoAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const setTakeProfitPrice = useSetAtom(takeProfitPriceAtom);
  const [takeProfit, setTakeProfit] = useAtom(takeProfitAtom);

  const [takeProfitInputPrice, setTakeProfitInputPrice] = useState<number | null>(null);
  const [isDisabled, setDisabled] = useState(false);

  const currentOrderBlockRef = useRef(orderInfo?.orderBlock);
  const currentLeverageRef = useRef(orderInfo?.leverage);

  const handleTakeProfitPriceChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const takeProfitPriceValue = event.target.value;
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

  const stepSize = useMemo(() => calculateStepSize(selectedPerpetual?.indexPrice), [selectedPerpetual?.indexPrice]);

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
  }, [minTakeProfitPrice, maxTakeProfitPrice, takeProfitInputPrice, setTakeProfit, setTakeProfitPrice]);

  useEffect(() => {
    if (currentOrderBlockRef.current !== orderInfo?.orderBlock) {
      currentOrderBlockRef.current = orderInfo?.orderBlock;

      setTakeProfitPrice(null);
      setTakeProfitInputPrice(null);

      if (orderInfo?.takeProfit === null) {
        setTakeProfit(TakeProfitE.None);
      }
    }
  }, [orderInfo?.orderBlock, orderInfo?.takeProfit, setTakeProfitPrice, setTakeProfit]);

  useEffect(() => {
    if (currentLeverageRef.current !== orderInfo?.leverage) {
      currentLeverageRef.current = orderInfo?.leverage;

      validateTakeProfitPrice();
    }
  }, [orderInfo?.leverage, validateTakeProfitPrice]);

  useEffect(() => {
    if (takeProfit && takeProfit !== TakeProfitE.None && orderInfo?.takeProfitPrice) {
      setTakeProfitInputPrice(
        Math.max(0.000000001, +orderInfo.takeProfitPrice.toFixed(valueToFractionDigits(+orderInfo.takeProfitPrice)))
      );
    } else if (takeProfit && takeProfit === TakeProfitE.None) {
      setTakeProfitInputPrice(null);
    }
  }, [takeProfit, orderInfo?.takeProfitPrice]);

  useEffect(() => {
    if (orderInfo && orderInfo.reduceOnly && orderInfo.orderType !== OrderTypeE.Market) {
      setTakeProfitInputPrice(null);
      setTakeProfitPrice(null);
      setTakeProfit(TakeProfitE.None);
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [setTakeProfitInputPrice, setTakeProfitPrice, setTakeProfit, orderInfo]);

  const translationMap: Record<TakeProfitE, string> = {
    [TakeProfitE.None]: t('pages.trade.order-block.take-profit.none'),
    [TakeProfitE['1%']]: '1%',
    [TakeProfitE['50%']]: '50%',
    [TakeProfitE['100%']]: '100%',
    [TakeProfitE['500%']]: '500%',
  };

  return (
    <CustomPriceSelector<TakeProfitE>
      id="custom-take-profit-price"
      label={
        <InfoLabelBlock
          title={t('pages.trade.order-block.take-profit.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.take-profit.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.take-profit.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.take-profit.body3')}</Typography>
            </>
          }
        />
      }
      options={Object.values(TakeProfitE)}
      translationMap={translationMap}
      handlePriceChange={handleTakeProfitChange}
      handleInputPriceChange={handleTakeProfitPriceChange}
      validateInputPrice={validateTakeProfitPrice}
      selectedInputPrice={takeProfitInputPrice}
      selectedPrice={takeProfit}
      currency={selectedPerpetual?.quoteCurrency}
      stepSize={stepSize}
      disabled={isDisabled}
    />
  );
});

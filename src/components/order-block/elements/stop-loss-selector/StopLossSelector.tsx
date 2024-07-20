import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { priceToProb } from '@d8x/perpetuals-sdk';

import { Typography } from '@mui/material';

import { CustomPriceSelector } from 'components/custom-price-selector/CustomPriceSelector';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { orderInfoAtom, stopLossAtom, stopLossPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, traderAPIAtom } from 'store/pools.store';
import { OrderBlockE, OrderTypeE, StopLossE } from 'types/enums';
import { valueToFractionDigits } from 'utils/formatToCurrency';

export const StopLossSelector = memo(() => {
  const { t } = useTranslation();
  const traderAPI = useAtomValue(traderAPIAtom);

  const orderInfo = useAtomValue(orderInfoAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const setStopLossPrice = useSetAtom(stopLossPriceAtom);
  const [stopLoss, setStopLoss] = useAtom(stopLossAtom);

  const [stopLossInputPrice, setStopLossInputPrice] = useState<number | null>(null);
  const [isDisabled, setDisabled] = useState(false);

  const currentOrderBlockRef = useRef(orderInfo?.orderBlock);
  const currentLeverageRef = useRef(orderInfo?.leverage);

  const handleStopLossPriceChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const stopLossPriceValue = event.target.value;
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

  const midPrice = useMemo(() => {
    if (!!traderAPI && !!orderInfo) {
      try {
        return traderAPI?.isPredictionMarket(orderInfo.symbol) ? priceToProb(orderInfo.midPrice) : orderInfo.midPrice;
      } catch (error) {
        // skip
      }
    }
    return [orderInfo?.midPrice];
  }, [orderInfo, traderAPI]);

  const minStopLossPrice: number = useMemo(() => {
    if (typeof midPrice !== 'number') {
      return 0.000000001;
    }
    if (midPrice && orderInfo?.orderBlock === OrderBlockE.Short) {
      return midPrice;
    } else if (orderInfo?.leverage) {
      return Math.max(0.000000001, midPrice - midPrice / orderInfo.leverage);
    }
    return 0.000000001;
  }, [orderInfo?.orderBlock, orderInfo?.leverage, midPrice]);

  const maxStopLossPrice = useMemo(() => {
    if (typeof midPrice === 'number' && orderInfo?.orderBlock === OrderBlockE.Long) {
      return midPrice;
    } else if (typeof midPrice === 'number' && orderInfo?.leverage) {
      return midPrice + midPrice / orderInfo.leverage;
    }
  }, [orderInfo?.orderBlock, orderInfo?.leverage, midPrice]);

  const stepSize = useMemo(() => calculateStepSize(selectedPerpetual?.indexPrice), [selectedPerpetual?.indexPrice]);

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
  }, [minStopLossPrice, maxStopLossPrice, stopLossInputPrice, setStopLoss, setStopLossPrice]);

  useEffect(() => {
    if (currentOrderBlockRef.current !== orderInfo?.orderBlock) {
      currentOrderBlockRef.current = orderInfo?.orderBlock;

      setStopLossPrice(null);
      setStopLossInputPrice(null);

      if (orderInfo?.stopLoss === null) {
        setStopLoss(StopLossE.None);
      }
    }
  }, [orderInfo?.orderBlock, orderInfo?.stopLoss, setStopLossPrice, setStopLoss]);

  useEffect(() => {
    if (currentLeverageRef.current !== orderInfo?.leverage) {
      currentLeverageRef.current = orderInfo?.leverage;

      validateStopLossPrice();
    }
  }, [orderInfo?.leverage, validateStopLossPrice]);

  useEffect(() => {
    if (stopLoss && stopLoss !== StopLossE.None && orderInfo?.stopLossPrice) {
      setStopLossInputPrice(+orderInfo.stopLossPrice.toFixed(valueToFractionDigits(+orderInfo.stopLossPrice)));
    } else if (stopLoss && stopLoss === StopLossE.None) {
      setStopLossInputPrice(null);
    }
  }, [stopLoss, orderInfo?.stopLossPrice]);

  useEffect(() => {
    if (orderInfo && orderInfo.reduceOnly && orderInfo.orderType !== OrderTypeE.Market) {
      setStopLossInputPrice(null);
      setStopLossPrice(null);
      setStopLoss(StopLossE.None);
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [setStopLossInputPrice, setStopLossPrice, setStopLoss, orderInfo]);

  const translationMap: Record<StopLossE, string> = {
    [StopLossE.None]: t('pages.trade.order-block.stop-loss.none'),
    [StopLossE['1%']]: '1%',
    [StopLossE['25%']]: '25%',
    [StopLossE['50%']]: '50%',
    [StopLossE['75%']]: '75%',
  };

  return (
    <CustomPriceSelector<StopLossE>
      id="custom-stop-loss-price"
      label={
        <InfoLabelBlock
          title={t('pages.trade.order-block.stop-loss.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.stop-loss.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.stop-loss.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.stop-loss.body3')}</Typography>
            </>
          }
        />
      }
      options={Object.values(StopLossE)}
      translationMap={translationMap}
      handlePriceChange={handleStopLossChange}
      handleInputPriceChange={handleStopLossPriceChange}
      validateInputPrice={validateStopLossPrice}
      selectedInputPrice={stopLossInputPrice}
      selectedPrice={stopLoss}
      currency={selectedPerpetual?.quoteCurrency}
      stepSize={stepSize}
      disabled={isDisabled}
    />
  );
});

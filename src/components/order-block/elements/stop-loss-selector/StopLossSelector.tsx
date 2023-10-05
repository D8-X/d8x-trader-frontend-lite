import { useAtom, useSetAtom } from 'jotai';
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { CustomPriceSelector } from 'components/custom-price-selector/CustomPriceSelector';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { orderInfoAtom, stopLossAtom, stopLossPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { OrderBlockE, StopLossE } from 'types/enums';
import { getFractionDigits } from 'utils/formatToCurrency';

import commonStyles from '../../OrderBlock.module.scss';

export const StopLossSelector = memo(() => {
  const { t } = useTranslation();

  const [orderInfo] = useAtom(orderInfoAtom);
  const [stopLoss, setStopLoss] = useAtom(stopLossAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const setStopLossPrice = useSetAtom(stopLossPriceAtom);

  const [stopLossInputPrice, setStopLossInputPrice] = useState<number | null>(null);

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

  const minStopLossPrice = useMemo(() => {
    if (orderInfo?.midPrice && orderInfo.orderBlock === OrderBlockE.Short) {
      return orderInfo.midPrice;
    } else if (orderInfo?.midPrice && orderInfo?.leverage) {
      return orderInfo.midPrice - orderInfo.midPrice / orderInfo.leverage;
    }
    return 0;
  }, [orderInfo?.midPrice, orderInfo?.orderBlock, orderInfo?.leverage]);

  const maxStopLossPrice = useMemo(() => {
    if (orderInfo?.midPrice && orderInfo.orderBlock === OrderBlockE.Long) {
      return orderInfo.midPrice;
    } else if (orderInfo?.midPrice && orderInfo?.leverage) {
      return orderInfo.midPrice + orderInfo.midPrice / orderInfo.leverage;
    }
  }, [orderInfo?.midPrice, orderInfo?.orderBlock, orderInfo?.leverage]);

  const fractionDigits = useMemo(
    () => getFractionDigits(selectedPerpetual?.quoteCurrency),
    [selectedPerpetual?.quoteCurrency]
  );

  const stepSize = useMemo(() => calculateStepSize(selectedPerpetual?.indexPrice), [selectedPerpetual?.indexPrice]);

  const validateStopLossPrice = useCallback(() => {
    if (stopLossInputPrice === null) {
      setStopLossPrice(null);
      setStopLoss(StopLossE.None);
      return;
    }

    if (maxStopLossPrice && stopLossInputPrice > maxStopLossPrice) {
      const maxStopLossPriceRounded = +maxStopLossPrice.toFixed(fractionDigits);
      setStopLossPrice(maxStopLossPriceRounded);
      setStopLossInputPrice(maxStopLossPriceRounded);
      return;
    }
    if (stopLossInputPrice < minStopLossPrice) {
      const minStopLossPriceRounded = +minStopLossPrice.toFixed(fractionDigits);
      setStopLossPrice(minStopLossPriceRounded);
      setStopLossInputPrice(minStopLossPriceRounded);
      return;
    }

    setStopLossPrice(stopLossInputPrice);
  }, [minStopLossPrice, maxStopLossPrice, stopLossInputPrice, setStopLoss, setStopLossPrice, fractionDigits]);

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
      setStopLossInputPrice(+orderInfo.stopLossPrice.toFixed(fractionDigits));
    }
  }, [stopLoss, orderInfo?.stopLossPrice, fractionDigits]);

  const translationMap: Record<StopLossE, string> = {
    [StopLossE.None]: t('pages.trade.order-block.stop-loss.none'),
    [StopLossE['10%']]: '10%',
    [StopLossE['25%']]: '25%',
    [StopLossE['50%']]: '50%',
    [StopLossE['75%']]: '75%',
  };

  return (
    <CustomPriceSelector<StopLossE>
      id="custom-stop-loss-price"
      label={
        <InfoBlock
          title={t('pages.trade.order-block.stop-loss.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.stop-loss.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.stop-loss.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.stop-loss.body3')}</Typography>
            </>
          }
          classname={commonStyles.actionIcon}
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
    />
  );
});

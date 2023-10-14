import { useAtom, useSetAtom } from 'jotai';
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { CustomPriceSelector } from 'components/custom-price-selector/CustomPriceSelector';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { orderInfoAtom, takeProfitAtom, takeProfitPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { OrderBlockE, TakeProfitE } from 'types/enums';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import commonStyles from '../../OrderBlock.module.scss';

export const TakeProfitSelector = memo(() => {
  const { t } = useTranslation();

  const [orderInfo] = useAtom(orderInfoAtom);
  const [takeProfit, setTakeProfit] = useAtom(takeProfitAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const setTakeProfitPrice = useSetAtom(takeProfitPriceAtom);

  const [takeProfitInputPrice, setTakeProfitInputPrice] = useState<number | null>(null);

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

  const minTakeProfitPrice = useMemo(() => {
    if (orderInfo?.midPrice && orderInfo.orderBlock === OrderBlockE.Long) {
      return orderInfo.midPrice;
    }
    return 0.000000001;
  }, [orderInfo?.midPrice, orderInfo?.orderBlock]);

  const maxTakeProfitPrice = useMemo(() => {
    if (orderInfo?.midPrice && orderInfo.orderBlock === OrderBlockE.Short) {
      return orderInfo.midPrice;
    }
    return undefined;
  }, [orderInfo?.midPrice, orderInfo?.orderBlock]);

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

  const translationMap: Record<TakeProfitE, string> = {
    [TakeProfitE.None]: t('pages.trade.order-block.take-profit.none'),
    [TakeProfitE['25%']]: '35%',
    [TakeProfitE['50%']]: '50%',
    [TakeProfitE['100%']]: '100%',
    [TakeProfitE['500%']]: '500%',
  };

  return (
    <CustomPriceSelector<TakeProfitE>
      id="custom-take-profit-price"
      label={
        <InfoBlock
          title={t('pages.trade.order-block.take-profit.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.take-profit.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.take-profit.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.take-profit.body3')}</Typography>
            </>
          }
          classname={commonStyles.actionIcon}
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
    />
  );
});

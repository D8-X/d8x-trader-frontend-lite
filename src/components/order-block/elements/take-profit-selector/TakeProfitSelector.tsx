import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { CustomPriceModal } from 'components/custom-price-modal/CustomPriceModal';
import { CustomPriceSelector } from 'components/custom-price-selector/CustomPriceSelector';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { takeProfitModalOpenAtom } from 'store/global-modals.store';
import { orderInfoAtom, takeProfitAtom, takeProfitInputPriceAtom, takeProfitPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { OrderTypeE, TakeProfitE } from 'types/enums';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import { useTakeProfit } from './useTakeProfit';

import styles from './TakeProfitSelector.module.scss';

export const TakeProfitSelector = memo(() => {
  const { t } = useTranslation();

  const orderInfo = useAtomValue(orderInfoAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const setTakeProfitPrice = useSetAtom(takeProfitPriceAtom);
  const setTakeProfitModalOpen = useSetAtom(takeProfitModalOpenAtom);
  const [takeProfit, setTakeProfit] = useAtom(takeProfitAtom);
  const [takeProfitInputPrice, setTakeProfitInputPrice] = useAtom(takeProfitInputPriceAtom);

  const [isDisabled, setDisabled] = useState(false);

  const currentOrderBlockRef = useRef(orderInfo?.orderBlock);
  const currentLeverageRef = useRef(orderInfo?.leverage);

  const { handleTakeProfitPriceChange, validateTakeProfitPrice, midPrice } = useTakeProfit();

  const stepSize = useMemo(() => calculateStepSize(selectedPerpetual?.indexPrice), [selectedPerpetual?.indexPrice]);

  useEffect(() => {
    if (currentOrderBlockRef.current !== orderInfo?.orderBlock) {
      currentOrderBlockRef.current = orderInfo?.orderBlock;

      setTakeProfitPrice(null);
      setTakeProfitInputPrice(null);

      if (orderInfo?.takeProfit === null) {
        setTakeProfit(TakeProfitE.None);
      }
    }
  }, [orderInfo?.orderBlock, orderInfo?.takeProfit, setTakeProfit, setTakeProfitPrice, setTakeProfitInputPrice]);

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
  }, [takeProfit, orderInfo?.takeProfitPrice, setTakeProfitInputPrice]);

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

  const handleModalOpen = useCallback(() => {
    setTakeProfitModalOpen(true);
  }, [setTakeProfitModalOpen]);

  const calculatedPercent = useMemo(() => {
    if (takeProfitInputPrice === null || !midPrice || orderInfo?.leverage === undefined) {
      return '--';
    }
    let percent = (takeProfitInputPrice / midPrice - 1) * orderInfo?.leverage;
    if (Math.abs(percent) < 0.005) {
      percent = 0;
    }
    return `${Math.round(100 * percent)}%`;
  }, [midPrice, takeProfitInputPrice, orderInfo?.leverage]);

  return (
    <>
      <CustomPriceSelector
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
        handleInputPriceChange={handleTakeProfitPriceChange}
        validateInputPrice={validateTakeProfitPrice}
        selectedInputPrice={takeProfitInputPrice}
        stepSize={stepSize}
        disabled={isDisabled}
        percentComponent={
          <div onClick={handleModalOpen} className={styles.percent}>
            {calculatedPercent}
          </div>
        }
        className={styles.customPriceSelector}
      />

      <CustomPriceModal />
    </>
  );
});

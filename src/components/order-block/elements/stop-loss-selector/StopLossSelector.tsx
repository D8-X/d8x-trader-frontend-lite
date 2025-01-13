import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { CustomPriceModal } from 'components/custom-price-modal/CustomPriceModal';
import { CustomPriceSelector } from 'components/custom-price-selector/CustomPriceSelector';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { stopLossModalOpenAtom } from 'store/global-modals.store';
import { orderInfoAtom, stopLossAtom, stopLossInputPriceAtom, stopLossPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { OrderTypeE, StopLossE } from 'types/enums';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import { useStopLoss } from './useStopLoss';

import styles from './StopLossSelector.module.scss';

export const StopLossSelector = memo(() => {
  const { t } = useTranslation();

  const orderInfo = useAtomValue(orderInfoAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const setStopLossPrice = useSetAtom(stopLossPriceAtom);
  const setStopLossModalOpen = useSetAtom(stopLossModalOpenAtom);
  const [stopLoss, setStopLoss] = useAtom(stopLossAtom);
  const [stopLossInputPrice, setStopLossInputPrice] = useAtom(stopLossInputPriceAtom);

  const [isDisabled, setDisabled] = useState(false);

  const currentOrderBlockRef = useRef(orderInfo?.orderBlock);
  const currentLeverageRef = useRef(orderInfo?.leverage);

  const { handleStopLossPriceChange, validateStopLossPrice, midPrice } = useStopLoss();

  const stepSize = useMemo(() => calculateStepSize(selectedPerpetual?.indexPrice), [selectedPerpetual?.indexPrice]);

  useEffect(() => {
    if (currentOrderBlockRef.current !== orderInfo?.orderBlock) {
      currentOrderBlockRef.current = orderInfo?.orderBlock;

      setStopLossPrice(null);
      setStopLossInputPrice(null);

      if (orderInfo?.stopLoss === null) {
        setStopLoss(StopLossE.None);
      }
    }
  }, [orderInfo?.orderBlock, orderInfo?.stopLoss, setStopLoss, setStopLossPrice, setStopLossInputPrice]);

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
  }, [stopLoss, orderInfo?.stopLossPrice, setStopLossInputPrice]);

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

  const handleModalOpen = useCallback(() => {
    setStopLossModalOpen(true);
  }, [setStopLossModalOpen]);

  const calculatedPercent = useMemo(() => {
    if (stopLossInputPrice === null || !midPrice || orderInfo?.leverage === undefined) {
      return '--';
    }
    let percent = (stopLossInputPrice / midPrice - 1) * orderInfo?.leverage;
    if (percent > -0.005) {
      percent = 0;
    }
    return `${Math.round(100 * percent)}%`;
  }, [midPrice, stopLossInputPrice, orderInfo?.leverage]);

  return (
    <>
      <CustomPriceSelector
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
        handleInputPriceChange={handleStopLossPriceChange}
        validateInputPrice={validateStopLossPrice}
        selectedInputPrice={stopLossInputPrice}
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

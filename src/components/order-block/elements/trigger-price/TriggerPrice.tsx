import { useAtom, useAtomValue } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { orderTypeAtom, triggerPriceAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, perpetualStatisticsAtom, selectedPerpetualAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';

import styles from './TriggerPrice.module.scss';
import { priceToProb, TraderInterface } from '@d8x/perpetuals-sdk';

export const TriggerPrice = memo(() => {
  const { t } = useTranslation();

  const orderType = useAtomValue(orderTypeAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const perpetualStatistics = useAtomValue(perpetualStatisticsAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const [triggerPrice, setTriggerPrice] = useAtom(triggerPriceAtom);

  const [inputValue, setInputValue] = useState(`${triggerPrice}`);

  const inputValueChangedRef = useRef(false);

  const stepSize = useMemo(
    () => `${Math.min(1, +calculateStepSize(selectedPerpetual?.markPrice))}`,
    [selectedPerpetual?.markPrice]
  );

  const handleTriggerPriceChange = useCallback(
    (targetValue: string) => {
      if (targetValue) {
        setTriggerPrice(targetValue);
        setInputValue(targetValue);
      } else {
        const initialTrigger = perpetualStatistics?.markPrice === undefined ? -1 : perpetualStatistics?.markPrice;
        const userTrigger =
          perpetualStaticInfo && TraderInterface.isPredictionMarket(perpetualStaticInfo)
            ? priceToProb(initialTrigger)
            : initialTrigger;
        setTriggerPrice(`${userTrigger}`);
        setInputValue('');
      }
      inputValueChangedRef.current = true;
    },
    [setTriggerPrice, perpetualStatistics, perpetualStaticInfo]
  );

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${triggerPrice}`);
    }
    inputValueChangedRef.current = false;
  }, [triggerPrice]);

  const handleInputBlur = useCallback(() => {
    setInputValue(`${triggerPrice}`);
  }, [triggerPrice]);

  if (orderType !== OrderTypeE.Stop) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <Box className={styles.label}>
        <InfoLabelBlock
          title={t('pages.trade.order-block.trigger-price.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.trigger-price.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.trigger-price.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.trigger-price.body3')}</Typography>
            </>
          }
        />
      </Box>
      <ResponsiveInput
        id="trigger-size"
        inputValue={inputValue}
        setInputValue={handleTriggerPriceChange}
        handleInputBlur={handleInputBlur}
        currency={
          perpetualStaticInfo && TraderInterface.isPredictionMarket(perpetualStaticInfo)
            ? '%'
            : selectedPerpetual?.quoteCurrency
        }
        step={stepSize}
        min={0}
      />
    </Box>
  );
});

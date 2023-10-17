import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { orderTypeAtom, triggerPriceAtom } from 'store/order-block.store';
import { perpetualStatisticsAtom, selectedPerpetualAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';

import styles from './TriggerPrice.module.scss';

export const TriggerPrice = memo(() => {
  const { t } = useTranslation();

  const [orderType] = useAtom(orderTypeAtom);
  const [triggerPrice, setTriggerPrice] = useAtom(triggerPriceAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);

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
        setTriggerPrice(`${initialTrigger}`);
        setInputValue('');
      }
      inputValueChangedRef.current = true;
    },
    [setTriggerPrice, perpetualStatistics]
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
        currency={selectedPerpetual?.quoteCurrency}
        step={stepSize}
        min={0}
      />
    </Box>
  );
});

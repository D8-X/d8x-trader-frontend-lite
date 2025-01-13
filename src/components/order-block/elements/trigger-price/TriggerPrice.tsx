import { TraderInterface } from '@d8x/perpetuals-sdk';
import { useAtom, useAtomValue } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { InputE } from 'components/responsive-input/enums';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { calculateProbability } from 'helpers/calculateProbability';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { orderBlockAtom, orderTypeAtom, triggerPriceAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, perpetualStatisticsAtom, selectedPerpetualAtom } from 'store/pools.store';
import { OrderBlockE, OrderTypeE } from 'types/enums';

import styles from './TriggerPrice.module.scss';

export const TriggerPrice = memo(() => {
  const { t } = useTranslation();

  const orderType = useAtomValue(orderTypeAtom);
  const orderBlock = useAtomValue(orderBlockAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const perpetualStatistics = useAtomValue(perpetualStatisticsAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const [triggerPrice, setTriggerPrice] = useAtom(triggerPriceAtom);

  const [inputValue, setInputValue] = useState(`${triggerPrice}`);

  const inputValueChangedRef = useRef(false);

  const stepSize = useMemo(
    () => `${Math.min(1, +calculateStepSize(selectedPerpetual?.indexPrice))}`,
    [selectedPerpetual?.indexPrice]
  );

  const handleTriggerPriceChange = useCallback(
    (targetValue: string) => {
      if (targetValue) {
        setTriggerPrice(targetValue);
        setInputValue(targetValue);
      } else {
        const initialTrigger = perpetualStatistics?.markPrice === undefined ? -1 : perpetualStatistics?.markPrice;
        const userTrigger =
          perpetualStaticInfo && TraderInterface.isPredictionMarketStatic(perpetualStaticInfo)
            ? calculateProbability(initialTrigger, orderBlock === OrderBlockE.Short)
            : initialTrigger;
        setTriggerPrice(`${userTrigger}`);
        setInputValue('');
      }
      inputValueChangedRef.current = true;
    },
    [setTriggerPrice, perpetualStatistics, perpetualStaticInfo, orderBlock]
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
      <Box className={styles.labelHolder}>
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
        className={styles.responsiveInput}
        inputValue={inputValue}
        setInputValue={handleTriggerPriceChange}
        handleInputBlur={handleInputBlur}
        currency={
          <DynamicLogo
            className={styles.dynamicLogo}
            logoName={selectedPerpetual?.quoteCurrency.toLowerCase() ?? ''}
            width={24}
            height={24}
          />
        }
        step={stepSize}
        min={0}
        type={InputE.Outlined}
      />
    </Box>
  );
});

import { useAtom, useAtomValue } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { priceToProb, TraderInterface } from '@d8x/perpetuals-sdk';

import { Box, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { limitPriceAtom, orderBlockAtom, orderTypeAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, perpetualStatisticsAtom, selectedPerpetualAtom } from 'store/pools.store';
import { OrderBlockE, OrderTypeE } from 'types/enums';

import styles from './LimitPrice.module.scss';

export const LimitPrice = memo(() => {
  const { t } = useTranslation();

  const orderType = useAtomValue(orderTypeAtom);
  const orderBlock = useAtomValue(orderBlockAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const perpetualStatistics = useAtomValue(perpetualStatisticsAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const [limitPrice, setLimitPrice] = useAtom(limitPriceAtom);

  const [inputValue, setInputValue] = useState(limitPrice != null ? `${limitPrice}` : '');

  const inputValueChangedRef = useRef(false);
  const orderBlockChangedRef = useRef(true);

  const stepSize = useMemo(
    () => `${Math.min(1, +calculateStepSize(selectedPerpetual?.midPrice))}`,
    [selectedPerpetual?.midPrice]
  );

  const handleLimitPriceChange = useCallback(
    (targetValue: string) => {
      if (targetValue) {
        setLimitPrice(`${+targetValue}`);
        setInputValue(`${+targetValue}`);
      } else {
        if (orderType === OrderTypeE.Limit) {
          const initialLimit = perpetualStatistics?.midPrice === undefined ? -1 : perpetualStatistics.midPrice;
          const userLimit =
            perpetualStaticInfo && TraderInterface.isPredictionMarket(perpetualStaticInfo) && initialLimit > 0
              ? priceToProb(initialLimit)
              : initialLimit;
          setLimitPrice(`${userLimit}`);
          setInputValue('');
        } else if (orderType === OrderTypeE.Stop) {
          setLimitPrice(`-1`);
          setInputValue('');
        }
      }
      inputValueChangedRef.current = true;
    },
    [setLimitPrice, perpetualStatistics, perpetualStaticInfo, orderType]
  );

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(limitPrice != null ? `${limitPrice}` : '');
    }
    inputValueChangedRef.current = false;
  }, [limitPrice]);

  useEffect(() => {
    orderBlockChangedRef.current = true;
  }, [orderBlock]);

  useEffect(() => {
    if (orderBlockChangedRef.current && orderType === OrderTypeE.Limit && !!perpetualStatistics?.midPrice) {
      const direction = orderBlock === OrderBlockE.Long ? 1 : -1;
      const step = +stepSize;
      const initialLimit = Math.round(perpetualStatistics.midPrice * (1 + 0.01 * direction) * (1 / step)) / (1 / step);

      let isPredictionMarket = false;
      try {
        isPredictionMarket = !!perpetualStaticInfo && TraderInterface.isPredictionMarket(perpetualStaticInfo);
      } catch {
        // skip
      }

      const userLimit =
        isPredictionMarket && initialLimit > 0
          ? Math.round(priceToProb(perpetualStatistics.midPrice * (1 + 0.01 * direction)) * (1 / step)) / (1 / step)
          : initialLimit;
      setLimitPrice(`${userLimit}`);
      setInputValue('');
    }
    orderBlockChangedRef.current = false;
  }, [setLimitPrice, perpetualStaticInfo, perpetualStatistics?.midPrice, orderType, stepSize, orderBlock]);

  const handleInputBlur = useCallback(() => {
    setInputValue(limitPrice != null ? `${limitPrice}` : '');
  }, [limitPrice]);

  if (orderType === OrderTypeE.Market) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <Box className={styles.labelHolder}>
        <InfoLabelBlock
          title={t('pages.trade.order-block.limit-price.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.limit-price.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.limit-price.body2')}</Typography>
            </>
          }
        />
      </Box>
      <ResponsiveInput
        id="limit-size"
        inputValue={inputValue}
        setInputValue={handleLimitPriceChange}
        handleInputBlur={handleInputBlur}
        currency={selectedPerpetual?.quoteCurrency}
        placeholder="-"
        step={stepSize}
        min={-1}
      />
    </Box>
  );
});

import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { limitPriceAtom, orderTypeAtom } from 'store/order-block.store';
import { perpetualStatisticsAtom, selectedPerpetualAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';

import commonStyles from '../../OrderBlock.module.scss';
import styles from './LimitPrice.module.scss';

export const LimitPrice = memo(() => {
  const { t } = useTranslation();

  const [orderType] = useAtom(orderTypeAtom);
  const [limitPrice, setLimitPrice] = useAtom(limitPriceAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);

  const [inputValue, setInputValue] = useState(limitPrice != null ? `${limitPrice}` : '');

  const inputValueChangedRef = useRef(false);

  const stepSize = useMemo(() => {
    if (!selectedPerpetual?.midPrice) {
      return '1';
    }
    return `${Math.min(1, 1 / 10 ** Math.ceil(2.5 - Math.log10(selectedPerpetual.midPrice)))}`;
  }, [selectedPerpetual?.midPrice]);

  const handleLimitPriceChange = useCallback(
    (targetValue: string) => {
      if (targetValue) {
        setLimitPrice(targetValue);
        setInputValue(targetValue);
      } else {
        if (orderType === OrderTypeE.Limit) {
          const initialLimit = perpetualStatistics?.midPrice === undefined ? -1 : perpetualStatistics?.midPrice;
          setLimitPrice(`${initialLimit}`);
          setInputValue('');
        } else if (orderType === OrderTypeE.Stop) {
          setLimitPrice(`-1`);
          setInputValue('');
        }
      }
      inputValueChangedRef.current = true;
    },
    [setLimitPrice, perpetualStatistics, orderType]
  );

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(limitPrice != null ? `${limitPrice}` : '');
    }
    inputValueChangedRef.current = false;
  }, [limitPrice]);

  const handleInputBlur = useCallback(() => {
    setInputValue(limitPrice != null ? `${limitPrice}` : '');
  }, [limitPrice]);

  if (orderType === OrderTypeE.Market) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <Box className={styles.label}>
        <InfoBlock
          title={t('pages.trade.order-block.limit-price.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.limit-price.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.limit-price.body2')}</Typography>
            </>
          }
          classname={commonStyles.actionIcon}
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

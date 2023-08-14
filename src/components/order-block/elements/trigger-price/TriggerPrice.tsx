import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { orderTypeAtom, triggerPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, perpetualStatisticsAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';

import commonStyles from '../../OrderBlock.module.scss';
import styles from './TriggerPrice.module.scss';

export const TriggerPrice = memo(() => {
  const { t } = useTranslation();
  const [orderType] = useAtom(orderTypeAtom);
  const [triggerPrice, setTriggerPrice] = useAtom(triggerPriceAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [inputValue, setInputValue] = useState(`${triggerPrice}`);
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);

  const inputValueChangedRef = useRef(false);

  const stepSize = useMemo(() => {
    if (!selectedPerpetual?.indexPrice) {
      return '1';
    }
    return `${1 / 10 ** Math.ceil(2.5 - Math.log10(selectedPerpetual.indexPrice))}`;
  }, [selectedPerpetual?.indexPrice]);

  const handleTriggerPriceChange = useCallback(
    (targetValue: string) => {
      if (targetValue) {
        setTriggerPrice(targetValue);
        setInputValue(targetValue);
      } else {
        const initialTrigger =
          perpetualStatistics?.markPrice === undefined ? -1 : Math.round(100 * perpetualStatistics?.markPrice) / 100;
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
        <InfoBlock
          title={t('pages.trade.order-block.trigger-price.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.trigger-price.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.trigger-price.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.trigger-price.body3')}</Typography>
            </>
          }
          classname={commonStyles.actionIcon}
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

import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { limitPriceAtom, orderTypeAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, perpetualStatisticsAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';

import commonStyles from '../../OrderBlock.module.scss';
import styles from './LimitPrice.module.scss';

export const LimitPrice = memo(() => {
  const [orderType] = useAtom(orderTypeAtom);
  const [limitPrice, setLimitPrice] = useAtom(limitPriceAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [inputValue, setInputValue] = useState(`${limitPrice}`);
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const inputValueChangedRef = useRef(false);

  const handleLimitPriceChange = useCallback(
    (targetValue: string) => {
      if (targetValue) {
        setLimitPrice(targetValue);
        setInputValue(targetValue);
      } else {
        if (orderType === OrderTypeE.Limit) {
          const initialTrigger =
            perpetualStatistics?.markPrice === undefined ? -1 : Math.round(100 * perpetualStatistics?.markPrice) / 100;
          setLimitPrice(`${initialTrigger}`);
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
      setInputValue(`${limitPrice}`);
    }
    inputValueChangedRef.current = false;
  }, [limitPrice]);

  const handleInputBlur = useCallback(() => {
    setInputValue(`${limitPrice}`);
  }, [limitPrice]);

  if (orderType === OrderTypeE.Market) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <Box className={styles.label}>
        <InfoBlock
          title="Limit price"
          content={
            <>
              <Typography>
                If you specify a limit price your order will be executed at the predetermined limit price or a better
                price.
              </Typography>
              <Typography>
                For a stop order, setting a limit price is optional. A stop order with specified limit price is a
                stop-limit order, a stop order without specified limit price is a stop-market order.
              </Typography>
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
        step="1"
        min={-1}
      />
    </Box>
  );
});

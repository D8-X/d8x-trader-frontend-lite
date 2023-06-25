import { roundToLotString } from '@d8x/perpetuals-sdk';
import { useAtom } from 'jotai';
import type { ChangeEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { orderSizeAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, selectedPerpetualAtom } from 'store/pools.store';

import styles from './OrderSize.module.scss';

export const OrderSize = memo(() => {
  const [orderSize, setOrderSize] = useAtom(orderSizeAtom);
  const [perpetualStaticInfo] = useAtom(perpetualStaticInfoAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);

  const [inputValue, setInputValue] = useState(`${orderSize}`);

  const inputValueChangedRef = useRef(false);

  const handleInputCapture = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const targetValue = event.target.value;
      if (targetValue) {
        setOrderSize(+targetValue);
        setInputValue(targetValue);
      } else {
        setOrderSize(0);
        setInputValue('');
      }
      inputValueChangedRef.current = true;
    },
    [setOrderSize]
  );

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${orderSize}`);
    }
    inputValueChangedRef.current = false;
  }, [orderSize]);

  const handleInputBlur = useCallback(() => {
    if (perpetualStaticInfo) {
      const roundedValue = roundToLotString(orderSize, perpetualStaticInfo.lotSizeBC);
      setOrderSize(+roundedValue);
      setInputValue(roundedValue);
    }
  }, [perpetualStaticInfo, orderSize, setOrderSize]);

  const orderSizeStep = useMemo(() => {
    if (perpetualStaticInfo) {
      return roundToLotString(perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC);
    }
    return 0.1;
  }, [perpetualStaticInfo]);

  const minPositionString = useMemo(() => {
    if (perpetualStaticInfo) {
      return roundToLotString(10 * perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC);
    }
    return 0.1;
  }, [perpetualStaticInfo]);

  return (
    <Box className={styles.root}>
      <Box className={styles.label}>
        <InfoBlock
          title={
            <>
              <Typography variant="bodySmall">Order size</Typography>
            </>
          }
          content={
            <>
              <Typography> Sets the size of your order. </Typography>
              <Typography>
                The minimal position size is {minPositionString} {selectedPerpetual?.baseCurrency}, with a step size of{' '}
                {orderSizeStep} {selectedPerpetual?.baseCurrency}.
              </Typography>
            </>
          }
        />
      </Box>
      <OutlinedInput
        id="order-size"
        endAdornment={
          <InputAdornment position="end">
            <Typography variant="adornment">{selectedPerpetual?.baseCurrency}</Typography>
          </InputAdornment>
        }
        type="number"
        inputProps={{ step: orderSizeStep, min: 0 }}
        value={inputValue}
        onChange={handleInputCapture}
        onBlur={handleInputBlur}
      />
    </Box>
  );
});

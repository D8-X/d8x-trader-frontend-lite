import { useAtom } from 'jotai';
import { ChangeEvent, memo, useCallback, useState } from 'react';

import { Box, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { orderTypeAtom, triggerPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';

import styles from './TriggerPrice.module.scss';
import { InfoBlock } from '../../../info-block/InfoBlock';

export const TriggerPrice = memo(() => {
  const [orderType] = useAtom(orderTypeAtom);
  const [triggerPrice, setTriggerPrice] = useAtom(triggerPriceAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);

  const [inputValue, setInputValue] = useState(`${triggerPrice}`);

  const handleTriggerPriceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const targetValue = event.target.value;
      if (targetValue) {
        setTriggerPrice(+targetValue);
        setInputValue(targetValue);
      } else {
        setTriggerPrice(0);
        setInputValue('');
      }
    },
    [setTriggerPrice]
  );

  if (orderType !== OrderTypeE.Stop) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <Box className={styles.label}>
        <InfoBlock
          title="Trigger price"
          content={
            <>
              <Typography>The trigger price is the mark price at which your stop order is triggered.</Typography>
              <Typography>
                If you do not select a limit price in addition to your trigger price, you would be placing a stop-market
                order. Your order will be executed at the best available price once triggered.
              </Typography>
              <Typography>
                If you specify a limit price in addition to your trigger price, you would be placing a stop-limit order.
                Your order will be executed at the predetermined limit price or a better price.
              </Typography>
            </>
          }
        />
      </Box>
      <OutlinedInput
        id="trigger-size"
        endAdornment={
          <InputAdornment position="end">
            <Typography variant="adornment">{selectedPerpetual?.quoteCurrency}</Typography>
          </InputAdornment>
        }
        inputProps={{ step: 1, min: 0 }}
        type="number"
        defaultValue={inputValue}
        onChange={handleTriggerPriceChange}
      />
    </Box>
  );
});

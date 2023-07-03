import { useAtom } from 'jotai';
import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { orderTypeAtom, triggerPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';

import styles from './TriggerPrice.module.scss';

export const TriggerPrice = memo(() => {
  const [orderType] = useAtom(orderTypeAtom);
  const [triggerPrice, setTriggerPrice] = useAtom(triggerPriceAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);

  const handleTriggerPriceChange = useCallback(
    (targetValue: string) => {
      if (targetValue) {
        setTriggerPrice(targetValue);
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
      <ResponsiveInput
        id="trigger-size"
        inputValue={triggerPrice}
        setInputValue={handleTriggerPriceChange}
        currency={selectedPerpetual?.quoteCurrency}
        step="1"
        min={0}
      />
    </Box>
  );
});

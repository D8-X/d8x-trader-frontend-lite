import { useAtom } from 'jotai';
import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { limitPriceAtom, orderTypeAtom } from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { OrderTypeE } from 'types/enums';

import styles from './LimitPrice.module.scss';

export const LimitPrice = memo(() => {
  const [orderType] = useAtom(orderTypeAtom);
  const [limitPrice, setLimitPrice] = useAtom(limitPriceAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);

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
        />
      </Box>
      <ResponsiveInput
        id="limit-size"
        inputValue={limitPrice}
        setInputValue={setLimitPrice}
        currency={selectedPerpetual?.quoteCurrency}
        placeholder="-"
        step="1"
        min={-1}
      />
    </Box>
  );
});

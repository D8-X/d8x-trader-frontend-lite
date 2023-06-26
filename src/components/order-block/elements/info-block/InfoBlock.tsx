import { useAtom } from 'jotai';
import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { orderInfoAtom, orderSizeAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './InfoBlock.module.scss';

export const InfoBlock = memo(() => {
  const [orderInfo] = useAtom(orderInfoAtom);
  const [orderSize] = useAtom(orderSizeAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);

  const feeInCC = useMemo(() => {
    if (!orderInfo?.tradingFee || !selectedPerpetual?.collToQuoteIndexPrice || !selectedPerpetual?.indexPrice) {
      return undefined;
    }
    return (
      (orderSize * orderInfo.tradingFee * selectedPerpetual.indexPrice) / selectedPerpetual.collToQuoteIndexPrice / 1e4
    );
  }, [orderSize, orderInfo, selectedPerpetual]);

  return (
    <Box className={styles.root}>
      <Box className={styles.row}>
        <Typography variant="bodySmall">Order size</Typography>
        <Typography variant="bodySmallSB">{formatToCurrency(orderSize, selectedPerpetual?.baseCurrency)}</Typography>
      </Box>
      <Box className={styles.row}>
        <Typography variant="bodySmall">Fees</Typography>
        <Typography variant="bodySmallSB">
          {formatToCurrency(feeInCC, selectedPool?.poolSymbol)} {'('}
          {formatToCurrency(orderInfo?.tradingFee, 'bps', 1)}
          {')'}
        </Typography>
      </Box>
    </Box>
  );
});

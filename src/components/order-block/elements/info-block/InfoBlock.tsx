import { useAtom } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { orderInfoAtom } from 'store/order-block.store';
import { poolTokenBalanceAtom, selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import { orderSizeAtom } from '../order-size/store';
import styles from './InfoBlock.module.scss';

export const InfoBlock = memo(() => {
  const { t } = useTranslation();
  const [orderInfo] = useAtom(orderInfoAtom);
  const [orderSize] = useAtom(orderSizeAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [poolTokenBalance] = useAtom(poolTokenBalanceAtom);

  const feeInCC = useMemo(() => {
    if (!orderInfo?.tradingFee || !selectedPerpetual?.collToQuoteIndexPrice || !selectedPerpetual?.indexPrice) {
      return undefined;
    }
    return (
      (orderSize * orderInfo.tradingFee * selectedPerpetual.indexPrice) / selectedPerpetual.collToQuoteIndexPrice / 1e4
    );
  }, [orderSize, orderInfo, selectedPerpetual]);

  const feePct = useMemo(() => {
    if (orderInfo?.tradingFee) {
      return (
        (orderInfo.tradingFee * 0.01) / (1 + (orderInfo.stopLossPrice ? 1 : 0) + (orderInfo.takeProfitPrice ? 1 : 0))
      );
    }
  }, [orderInfo]);

  return (
    <Box className={styles.root}>
      <Box className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.balance')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {formatToCurrency(poolTokenBalance, orderInfo?.poolName)}
        </Typography>
      </Box>
      <Box className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.order-size')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {orderSize}
        </Typography>
      </Box>
      <Box className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.fees')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {formatToCurrency(feeInCC, selectedPool?.poolSymbol)} {'('}
          {formatToCurrency(feePct, '%', false, 3)}
          {')'}
        </Typography>
      </Box>
    </Box>
  );
});

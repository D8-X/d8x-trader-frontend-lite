import { useAtom } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { orderInfoAtom, orderTypeAtom, slippageSliderAtom } from 'store/order-block.store';
import { poolTokenBalanceAtom, selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import { orderSizeAtom } from '../order-size/store';
import { leverageAtom } from '../leverage-selector/store';
import styles from './InfoBlock.module.scss';
import { useFeeData } from 'wagmi';

export const InfoBlock = memo(() => {
  const { t } = useTranslation();
  const [orderInfo] = useAtom(orderInfoAtom);
  const [orderSize] = useAtom(orderSizeAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [poolTokenBalance] = useAtom(poolTokenBalanceAtom);
  const [leverage] = useAtom(leverageAtom);
  const [slippage] = useAtom(slippageSliderAtom);
  const [orderType] = useAtom(orderTypeAtom);
  const { data: gasInfo } = useFeeData({ formatUnits: 'ether' });

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

  const gasPrice = useMemo(() => {
    if (orderInfo && gasInfo?.formatted?.gasPrice) {
      return (
        +gasInfo.formatted.gasPrice *
        500_000 *
        (1 + (orderInfo.stopLossPrice ? 1 : 0) + (orderInfo.takeProfitPrice ? 1 : 0))
      );
    }
  }, [gasInfo, orderInfo]);

  const gasRebate = useMemo(() => {
    if (gasPrice) {
      return gasPrice * 0.77734375;
    }
  }, [gasPrice]);

  const approxDepositFromWallet = useMemo(() => {
    if (!orderInfo?.tradingFee || !selectedPerpetual?.collToQuoteIndexPrice || !selectedPerpetual?.indexPrice) {
      return undefined;
    }
    const slippagePct = orderType === 'Market' ? slippage / 100 : 0;
    const buffer = (1.001 + leverage * (0.009 + orderInfo?.tradingFee / 10000 + slippagePct)) * 1.01;
    return (orderSize * buffer * selectedPerpetual.indexPrice) / (selectedPerpetual.collToQuoteIndexPrice * leverage);
  }, [leverage, orderInfo, slippage, orderType, orderSize, selectedPerpetual]);

  return (
    <Box className={styles.root}>
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
          {t('pages.trade.order-block.info.balance')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {formatToCurrency(poolTokenBalance, orderInfo?.poolName)}
        </Typography>
      </Box>
      <Box className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.approx-deposit')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {formatToCurrency(approxDepositFromWallet, orderInfo?.poolName)}
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
      <Box className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          Gas Fees
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {formatToCurrency(gasPrice, 'ETH')} {'(Rebate '}
          {formatToCurrency(gasRebate, 'ETH')}
          {')'}
        </Typography>
      </Box>
    </Box>
  );
});

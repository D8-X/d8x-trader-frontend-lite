import { useAtom } from 'jotai';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainId, useFeeData } from 'wagmi';

import { Box, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

import { getSymbolPrice } from 'network/network';
import { orderInfoAtom, orderTypeAtom, slippageSliderAtom } from 'store/order-block.store';
import { gasTokenSymbolAtom, poolTokenBalanceAtom, selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import { orderSizeAtom } from '../order-size/store';
import { leverageAtom } from '../leverage-selector/store';

import styles from './InfoBlock.module.scss';

export const InfoBlock = memo(() => {
  const { t } = useTranslation();
  const [orderInfo] = useAtom(orderInfoAtom);
  const [orderSize] = useAtom(orderSizeAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [poolTokenBalance] = useAtom(poolTokenBalanceAtom);
  const [gasTokenSymbol] = useAtom(gasTokenSymbolAtom);
  const [leverage] = useAtom(leverageAtom);
  const [slippage] = useAtom(slippageSliderAtom);
  const [orderType] = useAtom(orderTypeAtom);

  const { data: gasPriceETH } = useFeeData({ formatUnits: 'ether' });

  const [gasPriceUSD, setGasPriceUSD] = useState(0);
  const chainId = useChainId();

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

  const gasFee = useMemo(() => {
    if (orderInfo && gasPriceUSD) {
      return (
        gasPriceUSD * (600_000 + (orderInfo.stopLossPrice ? 400_000 : 0) + (orderInfo.takeProfitPrice ? 400_000 : 0))
      );
    }
  }, [gasPriceUSD, orderInfo]);

  const gasRebate = useMemo(() => {
    if (gasFee) {
      return gasFee * 0.77734375;
    }
  }, [gasFee]);

  const approxDepositFromWallet = useMemo(() => {
    if (!orderInfo?.tradingFee || !selectedPerpetual?.collToQuoteIndexPrice || !selectedPerpetual?.indexPrice) {
      return undefined;
    }
    const slippagePct = orderType === 'Market' ? slippage / 100 : 0;
    const buffer = (1.001 + leverage * (0.009 + orderInfo?.tradingFee / 10000 + slippagePct)) * 1.01;
    return (orderSize * buffer * selectedPerpetual.indexPrice) / (selectedPerpetual.collToQuoteIndexPrice * leverage);
  }, [leverage, orderInfo, slippage, orderType, orderSize, selectedPerpetual]);

  useEffect(() => {
    if (gasTokenSymbol && gasPriceETH?.formatted?.gasPrice) {
      getSymbolPrice(gasTokenSymbol)
        .then((res) => {
          setGasPriceUSD(+res[0].price.price * 10 ** res[0].price.expo * +(gasPriceETH.formatted.gasPrice || 0));
        })
        .catch(() => {});
    }
  }, [gasPriceETH, gasTokenSymbol]);

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
        <Tooltip title={selectedPool?.marginTokenAddr ? selectedPool.marginTokenAddr.toString() : '...'}>
          <Typography variant="bodySmallSB" className={styles.infoTextTooltip}>
            {formatToCurrency(poolTokenBalance, orderInfo?.poolName)}
          </Typography>
        </Tooltip>
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
      {chainId !== undefined && chainId === 1101 && (
        <Box className={styles.row}>
          <Typography variant="bodySmallPopup" className={styles.infoText}>
            {t('pages.trade.order-block.info.gas')}
          </Typography>
          <Typography variant="bodySmallSB" className={styles.infoText}>
            {formatToCurrency(gasFee, '$', undefined, 2)} {'('}
            {t('pages.trade.order-block.info.rebate')}
            {': '}
            {formatToCurrency(gasRebate, '$', undefined, 2)}
            {')'}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

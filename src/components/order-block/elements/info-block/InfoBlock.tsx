import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Typography } from '@mui/material';

import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';
import { orderBlockAtom, orderInfoAtom, orderTypeAtom, slippageSliderAtom } from 'store/order-block.store';
import {
  perpetualStaticInfoAtom,
  poolTokenBalanceAtom,
  positionsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
} from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';
import { OrderBlockE, OrderSideE } from 'types/enums';

import { orderSizeAtom } from '../order-size/store';
import { leverageAtom } from '../leverage-selector/store';

import styles from './InfoBlock.module.scss';

export const InfoBlock = memo(() => {
  const { t } = useTranslation();

  const orderInfo = useAtomValue(orderInfoAtom);
  const orderSize = useAtomValue(orderSizeAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const poolTokenBalance = useAtomValue(poolTokenBalanceAtom);
  const leverage = useAtomValue(leverageAtom);
  const orderType = useAtomValue(orderTypeAtom);
  const slippage = useAtomValue(slippageSliderAtom);
  const orderBlock = useAtomValue(orderBlockAtom);
  const positions = useAtomValue(positionsAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);

  const { chainId } = useAccount();

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

  const feeReduction = useMemo(() => {
    if (orderInfo?.baseFee && orderInfo?.tradingFee !== undefined && orderInfo?.tradingFee !== null) {
      return (1 - orderInfo.tradingFee / orderInfo.baseFee) * 100;
    }
  }, [orderInfo]);

  const baseFeeInCC = useMemo(() => {
    if (!orderInfo?.baseFee || !selectedPerpetual?.collToQuoteIndexPrice || !selectedPerpetual?.indexPrice) {
      return undefined;
    }
    return (
      (orderSize * orderInfo.baseFee * selectedPerpetual.indexPrice) / selectedPerpetual.collToQuoteIndexPrice / 1e4
    );
  }, [orderSize, orderInfo, selectedPerpetual]);

  const approxDepositFromWallet = useMemo(() => {
    if (!orderInfo?.tradingFee || !selectedPerpetual?.collToQuoteIndexPrice || !selectedPerpetual?.indexPrice) {
      return undefined;
    }

    if (!poolTokenBalance || !selectedPool || !selectedPerpetual || !perpetualStaticInfo) {
      return;
    }

    let collateralCC = 0;
    const selectedPerpetualSymbol = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`;
    const openPosition = positions.find((position) => position.symbol === selectedPerpetualSymbol);
    const orderBlockSide = orderBlock === OrderBlockE.Long ? OrderSideE.Buy : OrderSideE.Sell;
    if (openPosition && openPosition.side !== orderBlockSide) {
      collateralCC = openPosition.collateralCC + openPosition.unrealizedPnlQuoteCCY;
    }

    let orderSizeNet = orderSize;
    if (openPosition && openPosition.side !== orderBlockSide) {
      orderSizeNet = orderSize - openPosition.positionNotionalBaseCCY;
    }

    const slippagePct = orderType === 'Market' ? slippage / 100 : 0;
    const orderFeeBps = orderInfo?.tradingFee || 0;
    const direction = orderBlock === OrderBlockE.Long ? 1 : -1;
    const limitPrice = selectedPerpetual.indexPrice * (1 + (direction * slippagePct) / 100);

    const buffer =
      selectedPerpetual.indexPrice * (orderFeeBps / 10_000) +
      selectedPerpetual.markPrice / leverage +
      Math.max(direction * (limitPrice - selectedPerpetual.markPrice), 0);

    return Math.max(
      (orderSizeNet * buffer) / selectedPerpetual.collToQuoteIndexPrice -
        collateralCC +
        perpetualStaticInfo.referralRebate,
      0
    );
  }, [
    leverage,
    orderInfo,
    slippage,
    orderBlock,
    orderType,
    orderSize,
    perpetualStaticInfo,
    poolTokenBalance,
    positions,
    selectedPerpetual,
    selectedPool,
  ]);

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.order-size')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {orderSize}
        </Typography>
      </div>
      <div className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.balance')}
        </Typography>
        <TooltipMobile tooltip={selectedPool?.marginTokenAddr ? selectedPool.marginTokenAddr.toString() : '...'}>
          <Typography variant="bodySmallSB" className={styles.infoTextTooltip}>
            {formatToCurrency(poolTokenBalance, orderInfo?.poolName)}
          </Typography>
        </TooltipMobile>
      </div>
      <div className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.approx-deposit')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {formatToCurrency(approxDepositFromWallet, orderInfo?.poolName)}
        </Typography>
      </div>
      <div className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.fees')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {feeReduction !== undefined && feeReduction > 0 && feeInCC !== undefined ? (
            <>
              <span style={{ textDecoration: 'line-through' }}>
                {formatToCurrency(baseFeeInCC, selectedPool?.poolSymbol)}
              </span>
              <span> {formatToCurrency(feeInCC, selectedPool?.poolSymbol)}</span>
            </>
          ) : (
            <>
              {formatToCurrency(feeInCC, selectedPool?.poolSymbol)} {'('}
              {formatToCurrency(feePct, '%', false, 3)}
              {')'}
            </>
          )}
        </Typography>
      </div>
      <div className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.execution-fees')}
        </Typography>
        <Typography variant="bodySmallSB" className={styles.infoText}>
          {formatToCurrency(perpetualStaticInfo?.referralRebate, selectedPool?.poolSymbol)}
        </Typography>
      </div>
      {chainId === 1101 && (
        <div className={styles.row}>
          <Typography variant="bodySmallPopup" className={styles.infoText}>
            {t('pages.trade.order-block.info.gas')}
          </Typography>
          <Typography variant="bodySmallSB" className={styles.infoText}>
            {'77% '}
            {t('pages.trade.order-block.info.rebate')}
          </Typography>
        </div>
      )}
    </div>
  );
});

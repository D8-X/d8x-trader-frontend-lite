import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Typography } from '@mui/material';

import { orderBlockAtom, orderInfoAtom, orderTypeAtom, slippageSliderAtom } from 'store/order-block.store';
import {
  collateralToSettleConversionAtom,
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
  const c2s = useAtomValue(collateralToSettleConversionAtom);

  const { chainId } = useAccount();

  const feeInCC = useMemo(() => {
    if (orderInfo?.isPredictionMarket && orderInfo?.tradingFee && selectedPerpetual?.collToQuoteIndexPrice) {
      return (orderSize * orderInfo.tradingFee) / selectedPerpetual.collToQuoteIndexPrice;
    }
    if (!orderInfo?.tradingFee || !selectedPerpetual?.collToQuoteIndexPrice || !selectedPerpetual?.indexPrice) {
      return undefined;
    }
    return (
      (orderSize * orderInfo.tradingFee * selectedPerpetual.indexPrice) / selectedPerpetual.collToQuoteIndexPrice / 1e4
    );
  }, [orderSize, orderInfo, selectedPerpetual]);

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
          {orderInfo?.isPredictionMarket ? t('common.cost-of-order') : t('pages.trade.order-block.info.fees')}
        </Typography>
        <Typography variant="bodySmallPopup" className={styles.infoTextNumber}>
          {feeReduction !== undefined && feeReduction > 0 && feeInCC !== undefined ? (
            <>
              <span style={{ textDecoration: 'line-through' }}>
                {baseFeeInCC === undefined || !selectedPool
                  ? '-'
                  : formatToCurrency(
                      baseFeeInCC * (c2s.get(selectedPool.poolSymbol)?.value ?? 1),
                      selectedPool.settleSymbol
                    )}
              </span>
              <span>
                {' '}
                {selectedPool
                  ? formatToCurrency(
                      feeInCC * (c2s.get(selectedPool.poolSymbol)?.value ?? 1),
                      selectedPool.settleSymbol
                    )
                  : '-'}
              </span>
            </>
          ) : (
            <>
              {feeInCC === undefined || !selectedPool
                ? '-'
                : formatToCurrency(
                    feeInCC * (c2s.get(selectedPool.poolSymbol)?.value ?? 1),
                    selectedPool.settleSymbol
                  )}{' '}
            </>
          )}
        </Typography>
      </div>
      <div className={styles.row}>
        <Typography variant="bodySmallPopup" className={styles.infoText}>
          {t('pages.trade.order-block.info.execution-fees')}
        </Typography>
        <Typography variant="bodySmallPopup" className={styles.infoTextNumber}>
          {perpetualStaticInfo && selectedPool
            ? formatToCurrency(
                perpetualStaticInfo.referralRebate * (c2s.get(selectedPool.poolSymbol)?.value ?? 1),
                selectedPool.settleSymbol
              )
            : '-'}
        </Typography>
      </div>
      {chainId === 1101 && (
        <div className={styles.row}>
          <Typography variant="bodySmallPopup" className={styles.infoText}>
            {t('pages.trade.order-block.info.gas')}
          </Typography>
          <Typography variant="bodySmallPopup" className={styles.infoTextNumber}>
            {'77% '}
            {t('pages.trade.order-block.info.rebate')}
          </Typography>
        </div>
      )}
      {orderInfo?.isPredictionMarket != true && (
        <div className={styles.row}>
          <Typography variant="bodySmallPopup" className={styles.infoText}>
            {t('pages.trade.order-block.info.approx-deposit')}
          </Typography>
          <Typography variant="bodySmallPopup" className={styles.infoTextNumber}>
            {approxDepositFromWallet === undefined || !selectedPool
              ? '-'
              : formatToCurrency(
                  approxDepositFromWallet * (c2s.get(selectedPool.poolSymbol)?.value ?? 1),
                  selectedPool.settleSymbol
                )}
          </Typography>
        </div>
      )}
      {orderInfo?.isPredictionMarket === true && (
        <div className={styles.row}>
          <Typography variant="bodySmallPopup" className={styles.infoText}>
            {t('common.potential-return')}
          </Typography>
          <Typography variant="bodySmallPopup" className={styles.infoTextNumber}>
            {approxDepositFromWallet === undefined || !selectedPool
              ? '-'
              : formatToCurrency(orderSize, selectedPool.settleSymbol)}
          </Typography>
        </div>
      )}
    </div>
  );
});

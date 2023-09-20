import { roundToLotString } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';

import { leverageAtom, orderBlockAtom, orderSizeAtom } from 'store/order-block.store';
import {
  perpetualStaticInfoAtom,
  poolTokenBalanceAtom,
  positionsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
} from 'store/pools.store';
import { OrderBlockE } from 'types/enums';

export const selectedCurrencyAtom = atom('');

export const maxOrderSizeAtom = atom((get) => {
  const selectedPool = get(selectedPoolAtom);
  const poolTokenBalance = get(poolTokenBalanceAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);
  if (!poolTokenBalance || !selectedPool || !selectedPerpetual) return;

  const leverage = get(leverageAtom);
  const orderBlock = get(orderBlockAtom);

  const buffer = (1.0005 + leverage * 0.008) * 1.01;
  const { collToQuoteIndexPrice, indexPrice } = selectedPerpetual;
  let collateralCC = 0;
  if (orderBlock !== OrderBlockE.Long) {
    const positions = get(positionsAtom);
    const selectedPerpetualSymbol = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`;
    const openPosition = positions.find((position) => position.symbol === selectedPerpetualSymbol);
    collateralCC = openPosition?.collateralCC || 0;
  }

  return ((poolTokenBalance + collateralCC) * leverage * collToQuoteIndexPrice) / (indexPrice * buffer);
});

export const setSizeFromSliderAtom = atom(
  (get) => {
    const max = get(maxOrderSizeAtom);
    if (!max) return 0;
    const orderSize = get(orderSizeAtom);

    return (orderSize * 100) / max;
  },
  async (get, set, percent: number) => {
    const max = get(maxOrderSizeAtom);
    const perpetualStaticInfo = get(perpetualStaticInfoAtom);
    if (!max || !perpetualStaticInfo) return;

    const orderSize = (max * percent) / 100;

    const roundedValueBase = Number(roundToLotString(orderSize, perpetualStaticInfo.lotSizeBC));

    set(orderSizeAtom, roundedValueBase);

    return orderSize;
  }
);

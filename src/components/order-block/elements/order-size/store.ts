import { roundToLotString } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';

import { orderBlockAtom } from 'store/order-block.store';
import {
  perpetualStaticInfoAtom,
  poolTokenBalanceAtom,
  positionsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
} from 'store/pools.store';
import { OrderBlockE } from 'types/enums';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import { leverageAtom } from '../leverage-selector/store';

export const selectedCurrencyAtom = atom('');
export const orderSizeAtom = atom(0);
export const inputValueAtom = atom('0');

const maxOrderSizeAtom = atom((get) => {
  const selectedPool = get(selectedPoolAtom);
  const poolTokenBalance = get(poolTokenBalanceAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);
  if (!poolTokenBalance || !selectedPool || !selectedPerpetual) return;

  const leverage = get(leverageAtom);
  const orderBlock = get(orderBlockAtom);

  const buffer = (1.001 + leverage * 0.05) * 1.05;
  const { collToQuoteIndexPrice, indexPrice } = selectedPerpetual;
  let collateralCC = 0;

  const positions = get(positionsAtom);
  const selectedPerpetualSymbol = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`;
  const openPosition = positions.find((position) => position.symbol === selectedPerpetualSymbol);
  const orderBlockSide = orderBlock === OrderBlockE.Long ? 'BUY' : 'SELL';

  if (openPosition && openPosition.side !== orderBlockSide) {
    collateralCC = openPosition.collateralCC;
  }

  return ((poolTokenBalance + collateralCC) * leverage * collToQuoteIndexPrice) / (indexPrice * buffer);
});

export const currentMultiplierAtom = atom((get) => {
  let currentMultiplier = 1;

  const selectedPool = get(selectedPoolAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);
  if (!selectedPool || !selectedPerpetual) return currentMultiplier;

  const selectedCurrency = get(selectedCurrencyAtom);

  const { collToQuoteIndexPrice, indexPrice } = selectedPerpetual;
  if (selectedCurrency === selectedPerpetual.quoteCurrency) {
    currentMultiplier = selectedPerpetual.indexPrice;
  } else if (selectedCurrency === selectedPool.poolSymbol) {
    currentMultiplier = indexPrice / collToQuoteIndexPrice;
  }
  return currentMultiplier;
});

export const setInputFromOrderSizeAtom = atom(null, (get, set, orderSize: number) => {
  const currentMultiplier = get(currentMultiplierAtom);

  let inputValue = '0';
  if (currentMultiplier === 1 || orderSize === 0) {
    inputValue = orderSize.toString();
  } else {
    const numberDigits = valueToFractionDigits(orderSize * currentMultiplier);
    inputValue = (orderSize * currentMultiplier).toFixed(numberDigits);
  }
  set(inputValueAtom, inputValue);
});

export const setSizeFromSliderAtom = atom(
  (get) => {
    const max = get(maxOrderSizeAtom);
    if (!max) return 0;
    const orderSize = get(orderSizeAtom);

    return (orderSize * 100) / max;
  },
  (get, set, percent: number) => {
    const max = get(maxOrderSizeAtom);
    const perpetualStaticInfo = get(perpetualStaticInfoAtom);

    if (!max || !perpetualStaticInfo) return;

    const orderSize = (max * percent) / 100;
    const roundedValueBase = Number(roundToLotString(orderSize, perpetualStaticInfo.lotSizeBC));

    set(orderSizeAtom, roundedValueBase);
    set(setInputFromOrderSizeAtom, roundedValueBase);

    return orderSize;
  }
);

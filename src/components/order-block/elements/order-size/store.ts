import { roundToLotString } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';

import { orderBlockAtom, orderSizeAtom } from 'store/order-block.store';
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
export const inputValueAtom = atom('');

export const maxOrderSizeAtom = atom((get) => {
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

  if (orderBlockSide !== openPosition?.side) {
    collateralCC = openPosition?.collateralCC || 0;
  }

  return ((poolTokenBalance + collateralCC) * leverage * collToQuoteIndexPrice) / (indexPrice * buffer);
});

const setInputFromOrderSizeAtom = atom(null, (get, set, orderSize: number) => {
  const selectedPool = get(selectedPoolAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);

  if (!selectedPool || !selectedPerpetual) return;

  const selectedCurrency = get(selectedCurrencyAtom);

  const { collToQuoteIndexPrice, indexPrice } = selectedPerpetual;
  let currentMultiplier = 1;
  if (selectedCurrency === selectedPerpetual.quoteCurrency) {
    currentMultiplier = selectedPerpetual.indexPrice;
  } else if (selectedCurrency === selectedPool.poolSymbol) {
    currentMultiplier = indexPrice / collToQuoteIndexPrice;
  }

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

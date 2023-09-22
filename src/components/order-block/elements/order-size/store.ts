import { roundToLotString } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';

import { orderBlockAtom, orderInfoAtom, orderTypeAtom, slippageSliderAtom } from 'store/order-block.store';
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

const selectedCurrencyPrimitiveAtom = atom('');
export const orderSizeAtom = atom(0);
export const inputValueAtom = atom('0');
export const maxTraderOrderSizeAtom = atom<number | undefined>(undefined);

export const maxOrderSizeAtom = atom((get) => {
  const selectedPool = get(selectedPoolAtom);
  const poolTokenBalance = get(poolTokenBalanceAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);
  const maxTraderOrderSize = get(maxTraderOrderSizeAtom);
  const orderType = get(orderTypeAtom);
  const orderInfo = get(orderInfoAtom);
  const slippage = orderType === 'Market' ? get(slippageSliderAtom) / 100 : 0;

  if (!poolTokenBalance || !selectedPool || !selectedPerpetual || !maxTraderOrderSize) {
    return;
  }

  const leverage = get(leverageAtom);
  const orderBlock = get(orderBlockAtom);
  const orderFee = orderInfo?.tradingFee || 0;

  const buffer = (1.001 + leverage * (0.009 + orderFee / 10000 + slippage)) * 1.01;

  const { collToQuoteIndexPrice, indexPrice } = selectedPerpetual;
  let collateralCC = 0;

  const positions = get(positionsAtom);
  const selectedPerpetualSymbol = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`;
  const openPosition = positions.find((position) => position.symbol === selectedPerpetualSymbol);
  const orderBlockSide = orderBlock === OrderBlockE.Long ? 'BUY' : 'SELL';

  if (openPosition && openPosition.side !== orderBlockSide) {
    collateralCC = openPosition.collateralCC;
  }

  const personalMax = ((poolTokenBalance + collateralCC) * leverage * collToQuoteIndexPrice) / (indexPrice * buffer);
  return personalMax > maxTraderOrderSize ? maxTraderOrderSize : personalMax;
});

export const currencyMultiplierAtom = atom((get) => {
  let currencyMultiplier = 1;

  const selectedPool = get(selectedPoolAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);
  if (!selectedPool || !selectedPerpetual) {
    return currencyMultiplier;
  }

  const selectedCurrency = get(selectedCurrencyPrimitiveAtom);

  const { collToQuoteIndexPrice, indexPrice } = selectedPerpetual;
  if (selectedCurrency === selectedPerpetual.quoteCurrency) {
    currencyMultiplier = selectedPerpetual.indexPrice;
  } else if (selectedCurrency === selectedPool.poolSymbol) {
    currencyMultiplier = indexPrice / collToQuoteIndexPrice;
  }
  return currencyMultiplier;
});

export const setInputFromOrderSizeAtom = atom(null, (get, set, orderSize: number) => {
  const currencyMultiplier = get(currencyMultiplierAtom);

  let inputValue;
  if (currencyMultiplier === 1 || orderSize === 0) {
    inputValue = orderSize.toString();
  } else {
    const numberDigits = valueToFractionDigits(orderSize * currencyMultiplier);
    inputValue = (orderSize * currencyMultiplier).toFixed(numberDigits);
  }
  set(inputValueAtom, inputValue);
});

export const setOrderSizeAtom = atom(null, (get, set, value: number) => {
  const perpetualStaticInfo = get(perpetualStaticInfoAtom);

  if (!perpetualStaticInfo) {
    return 0;
  }

  const roundedValueBase = Number(roundToLotString(value, perpetualStaticInfo.lotSizeBC));
  set(orderSizeAtom, roundedValueBase);
  return roundedValueBase;
});

export const selectedCurrencyAtom = atom(
  (get) => get(selectedCurrencyPrimitiveAtom),
  (get, set, currency: string) => {
    const orderSize = get(orderSizeAtom);

    set(selectedCurrencyPrimitiveAtom, currency);
    set(setInputFromOrderSizeAtom, orderSize);
  }
);

export const orderSizeSliderAtom = atom(
  (get) => {
    const max = get(maxOrderSizeAtom);
    if (!max) {
      return 0;
    }

    const orderSize = get(orderSizeAtom);
    return (orderSize * 100) / max;
  },
  (get, set, percent: number) => {
    const max = get(maxOrderSizeAtom);
    if (!max) {
      return;
    }

    const orderSize = (max * percent) / 100;
    const roundedValueBase = set(setOrderSizeAtom, orderSize);

    set(setInputFromOrderSizeAtom, roundedValueBase);
  }
);

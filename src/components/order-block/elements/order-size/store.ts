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
import { OrderBlockE, OrderSideE } from 'types/enums';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import { leverageAtom } from '../leverage-selector/store';

const selectedCurrencyPrimitiveAtom = atom('');
export const orderSizeAtom = atom(0);
export const inputValueAtom = atom('0');
export const maxTraderOrderSizeAtom = atom<number | undefined>(10000);

export const maxOrderSizeAtom = atom((get) => {
  const selectedPool = get(selectedPoolAtom);
  const poolTokenBalance = get(poolTokenBalanceAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);
  const maxTraderOrderSize = get(maxTraderOrderSizeAtom);
  const orderType = get(orderTypeAtom);
  const orderInfo = get(orderInfoAtom);
  const slippage = orderType === 'Market' ? get(slippageSliderAtom) / 100 : 0.01;

  if (!selectedPool || !selectedPerpetual || maxTraderOrderSize === undefined) {
    return;
  }

  const leverage = get(leverageAtom);
  const orderBlock = get(orderBlockAtom);
  const orderFeeBps = orderInfo?.tradingFee || 0;

  const { collToQuoteIndexPrice, indexPrice, markPrice } = selectedPerpetual;
  let collateralCC = 0;

  const positions = get(positionsAtom);
  const selectedPerpetualSymbol = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`;
  const openPosition = positions.find((position) => position.symbol === selectedPerpetualSymbol);
  const orderBlockSide = orderBlock === OrderBlockE.Long ? OrderSideE.Buy : OrderSideE.Sell;

  if (openPosition && openPosition.side !== orderBlockSide) {
    collateralCC = openPosition.collateralCC + openPosition.unrealizedPnlQuoteCCY;
  }
  const direction = orderBlock === OrderBlockE.Long ? 1 : -1;
  const limitPrice = indexPrice * (1 + direction * slippage);
  const buffer =
    indexPrice * (orderFeeBps / 10_000) + markPrice / leverage + Math.max(direction * (limitPrice - markPrice), 0);

  const poolTokenBalanceOrDefault = poolTokenBalance || 1000; // default of 1000 to make initial load faster

  const personalMax = (((poolTokenBalanceOrDefault + collateralCC) * collToQuoteIndexPrice) / buffer) * 0.99;
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
  if (selectedCurrency === selectedPerpetual.quoteCurrency && indexPrice > 0) {
    currencyMultiplier = indexPrice;
  } else if (selectedCurrency === selectedPool.poolSymbol && collToQuoteIndexPrice > 0 && indexPrice > 0) {
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

  const lotSizeBC = perpetualStaticInfo ? perpetualStaticInfo.lotSizeBC : 0.001; // default only while initializing

  const roundedValueBase = Number(roundToLotString(value, lotSizeBC));
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
    const actualMax = get(maxOrderSizeAtom);
    const max = actualMax || 10000;
    const orderSize = get(orderSizeAtom);
    return (orderSize * 100) / max;
  },
  (get, set, percent: number) => {
    const actualMax = get(maxOrderSizeAtom);
    const max = actualMax || 10000;
    const orderSize = (max * percent) / 100;
    const roundedValueBase = set(setOrderSizeAtom, orderSize);
    set(setInputFromOrderSizeAtom, roundedValueBase);
  }
);

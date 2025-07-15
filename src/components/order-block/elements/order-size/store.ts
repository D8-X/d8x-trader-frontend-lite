import { BUY_SIDE, pmFindMaxPersonalTradeSizeAtLeverage, roundToLotString, TraderInterface } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';

import { calculateProbability } from 'helpers/calculateProbability';
import { orderBlockAtom, orderInfoAtom } from 'store/order-block.store';
import {
  collateralToSettleConversionAtom,
  flatTokenAtom,
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
export const maxTraderOrderSizeAtom = atom<number | undefined>(undefined);

export const maxOrderSizeAtom = atom((get) => {
  const selectedPool = get(selectedPoolAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);
  const maxTraderOrderSize = get(maxTraderOrderSizeAtom);
  const orderInfo = get(orderInfoAtom);
  const leverage = get(leverageAtom);
  const orderBlock = get(orderBlockAtom);
  const poolTokenBalance = get(poolTokenBalanceAtom);
  const positions = get(positionsAtom);

  if (!selectedPool || !selectedPerpetual || maxTraderOrderSize === undefined) {
    return;
  }

  const { collToQuoteIndexPrice, indexPrice, markPrice } = selectedPerpetual;
  const orderBlockSide = orderBlock === OrderBlockE.Long ? OrderSideE.Buy : OrderSideE.Sell;
  const slippage = 0.01;
  const direction = orderBlock === OrderBlockE.Long ? 1 : -1;
  const limitPrice = indexPrice * (1 + direction * slippage);
  const poolTokenBalanceOrDefault =
    poolTokenBalance !== null && poolTokenBalance !== undefined ? poolTokenBalance : 10_000;
  const selectedPerpetualSymbol = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`;
  const openPosition = positions.find((position) => position.symbol === selectedPerpetualSymbol);
  const currentPosition = (openPosition?.positionNotionalBaseCCY ?? 0) * (openPosition?.side === BUY_SIDE ? 1 : -1);
  const currentCashCC =
    openPosition && openPosition.side !== orderBlockSide
      ? openPosition.collateralCC + openPosition.unrealizedPnlQuoteCCY / collToQuoteIndexPrice
      : 0;
  const currentLockedInValue = (openPosition?.entryPrice ?? 0) * currentPosition;
  const orderFeeBps = orderInfo?.tradingFee || 0;

  let personalMax: number;
  if (orderInfo?.isPredictionMarket) {
    personalMax = Math.abs(
      pmFindMaxPersonalTradeSizeAtLeverage(
        direction,
        leverage,
        poolTokenBalanceOrDefault,
        slippage,
        currentPosition,
        currentCashCC,
        currentLockedInValue,
        indexPrice,
        markPrice,
        collToQuoteIndexPrice,
        maxTraderOrderSize
      )
    );
  } else {
    const buffer =
      indexPrice * (orderFeeBps / 10_000) + markPrice / leverage + Math.max(direction * (limitPrice - markPrice), 0); // default of 10_000 to make initial load faster
    personalMax = (((poolTokenBalanceOrDefault + currentCashCC) * collToQuoteIndexPrice) / buffer) * 0.99;
  }

  return personalMax > maxTraderOrderSize ? maxTraderOrderSize : personalMax;
});

export const currencyMultiplierAtom = atom((get) => {
  let currencyMultiplier = 1;

  const orderBlock = get(orderBlockAtom);
  const selectedPool = get(selectedPoolAtom);
  const selectedPerpetual = get(selectedPerpetualAtom);
  const c2s = get(collateralToSettleConversionAtom);
  const perpetualStaticInfo = get(perpetualStaticInfoAtom);

  if (!selectedPool || !selectedPerpetual) {
    return currencyMultiplier;
  }

  const selectedCurrency = get(selectedCurrencyPrimitiveAtom);

  let isPredictionMarket = false;
  try {
    isPredictionMarket = !!perpetualStaticInfo && TraderInterface.isPredictionMarketStatic(perpetualStaticInfo);
  } catch {
    // skip
  }

  const flatToken = get(flatTokenAtom);

  const { collToQuoteIndexPrice, midPrice } = selectedPerpetual;
  if (selectedCurrency === selectedPerpetual.quoteCurrency && midPrice > 0) {
    currencyMultiplier = isPredictionMarket
      ? calculateProbability(midPrice, orderBlock === OrderBlockE.Short)
      : midPrice;
  } else if (selectedCurrency === selectedPool.settleSymbol && collToQuoteIndexPrice > 0 && midPrice > 0) {
    currencyMultiplier = isPredictionMarket
      ? (calculateProbability(midPrice, orderBlock === OrderBlockE.Short) / collToQuoteIndexPrice) *
        (c2s.get(selectedPool.poolSymbol)?.value ?? 1)
      : (midPrice / collToQuoteIndexPrice) * (c2s.get(selectedPool.poolSymbol)?.value ?? 1);
  } else if (
    flatToken &&
    selectedPool.poolId === flatToken.poolId &&
    selectedCurrency === flatToken.registeredSymbol &&
    flatToken.compositePrice
  ) {
    currencyMultiplier =
      (midPrice / collToQuoteIndexPrice) * (c2s.get(selectedPool.poolSymbol)?.value ?? 1) * flatToken.compositePrice;
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

  const lotSizeBC = perpetualStaticInfo ? perpetualStaticInfo.lotSizeBC : 0.000025; // default only while initializing

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
    const max = actualMax !== null && actualMax !== undefined ? actualMax : 10000;
    const orderSize = get(orderSizeAtom);
    if (max === 0) {
      return 0;
    } else {
      return (orderSize * 100) / max;
    }
  },
  (get, set, percent: number) => {
    const actualMax = get(maxOrderSizeAtom);
    const max = actualMax !== null && actualMax !== undefined ? actualMax : 10000;
    const orderSize = (max * percent) / 100;
    const roundedValueBase = set(setOrderSizeAtom, orderSize);
    set(setInputFromOrderSizeAtom, roundedValueBase);
  }
);

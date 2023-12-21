import { atom } from 'jotai';

import { leverageAtom, setLeverageAtom } from 'components/order-block/elements/leverage-selector/store';
import { inputValueAtom, orderSizeAtom } from 'components/order-block/elements/order-size/store';
import { createSymbol } from 'helpers/createSymbol';
import { ExpiryE, OrderBlockE, OrderTypeE, StopLossE, TakeProfitE } from 'types/enums';
import { OrderInfoI } from 'types/types';
import { mapSlippageToNumber } from 'utils/mapSlippageToNumber';
import { mapStopLossToNumber } from 'utils/mapStopLossToNumber';
import { mapTakeProfitToNumber } from 'utils/mapTakeProfitToNumber';

import { collateralDepositAtom, newPositionRiskAtom, perpetualStatisticsAtom, poolFeeAtom } from './pools.store';

export const orderBlockAtom = atom<OrderBlockE>(OrderBlockE.Long);
export const slippageSliderAtom = atom(2);
export const keepPositionLeverageAtom = atom(false);
export const reduceOnlyAtom = atom(false);
export const expireDaysAtom = atom(Number(ExpiryE['90D']));
export const stopLossAtom = atom<StopLossE | null>(StopLossE.None);
export const stopLossPriceAtom = atom<number | null>(null);
export const takeProfitAtom = atom<TakeProfitE | null>(TakeProfitE.None);
export const takeProfitPriceAtom = atom<number | null>(null);
export const storageKeyAtom = atom<string | null>(null);

export const latestOrderSentTimestampAtom = atom(0);

const limitPriceValueAtom = atom(-1);
const triggerPriceValueAtom = atom(0);

const orderTypeValueAtom = atom(OrderTypeE.Market);

export const orderTypeAtom = atom(
  (get) => {
    return get(orderTypeValueAtom);
  },
  (get, set, newType: OrderTypeE) => {
    if (newType === OrderTypeE.Limit) {
      const perpetualStatistics = get(perpetualStatisticsAtom);
      const orderBlock = get(orderBlockAtom);
      let initialLimit: number;
      if (perpetualStatistics?.midPrice) {
        const direction = orderBlock === OrderBlockE.Long ? 1 : -1;
        const step = Math.max(1, 10 ** Math.ceil(2.5 - Math.log10(perpetualStatistics?.midPrice)));
        initialLimit = Math.round(perpetualStatistics.midPrice * (1 + 0.01 * direction) * step) / step;
      } else {
        initialLimit = -1;
      }
      set(limitPriceValueAtom, initialLimit);
      set(triggerPriceValueAtom, -1);
    } else if (newType === OrderTypeE.Stop) {
      const perpetualStatistics = get(perpetualStatisticsAtom);
      let initialTrigger: number;
      if (perpetualStatistics?.markPrice) {
        const step = Math.max(1, 10 ** Math.ceil(2.5 - Math.log10(perpetualStatistics?.markPrice)));
        initialTrigger = Math.round(perpetualStatistics.markPrice * step) / step;
      } else {
        initialTrigger = -1;
      }
      set(limitPriceValueAtom, -1);
      set(triggerPriceValueAtom, initialTrigger);
    } else {
      set(limitPriceValueAtom, -1);
      set(triggerPriceValueAtom, -1);
    }
    set(orderTypeValueAtom, newType);
  }
);

export const limitPriceAtom = atom(
  (get) => {
    const orderType = get(orderTypeAtom);

    if (orderType === OrderTypeE.Market) {
      return null;
    }

    const limitPrice = get(limitPriceValueAtom);

    return limitPrice < 0 ? null : limitPrice;
  },
  (_get, set, newLimitPrice: string) => {
    set(limitPriceValueAtom, newLimitPrice === '' || +newLimitPrice < 0 ? -1 : +newLimitPrice);
  }
);

export const triggerPriceAtom = atom(
  (get) => {
    const orderType = get(orderTypeAtom);
    if (orderType === OrderTypeE.Market || orderType === OrderTypeE.Limit) {
      return 0;
    }
    const triggerPrice = get(triggerPriceValueAtom);
    return triggerPrice < 0 ? 0 : triggerPrice;
  },
  (_get, set, newTriggerPrice: string) => {
    set(triggerPriceValueAtom, newTriggerPrice === '' || +newTriggerPrice < 0 ? -1 : +newTriggerPrice);
  }
);

export const orderInfoAtom = atom<OrderInfoI | null>((get) => {
  const perpetualStatistics = get(perpetualStatisticsAtom);
  if (!perpetualStatistics) {
    return null;
  }
  const poolFee = get(poolFeeAtom);

  const newPositionRisk = get(newPositionRiskAtom);
  const collateralDeposit = get(collateralDepositAtom);
  // const positions = get(positionsAtom);

  const orderBlock = get(orderBlockAtom);
  const orderType = get(orderTypeAtom);
  const leverageSaved = get(leverageAtom);
  const size = get(orderSizeAtom);
  const limitPrice = get(limitPriceAtom);
  const triggerPrice = get(triggerPriceAtom);
  const keepPositionLeverage = get(keepPositionLeverageAtom);
  const reduceOnly = get(reduceOnlyAtom);
  const slippage = get(slippageSliderAtom);
  const expireDays = get(expireDaysAtom);
  const stopLoss = get(stopLossAtom);
  const stopLossCustomPrice = get(stopLossPriceAtom);
  const takeProfit = get(takeProfitAtom);
  const takeProfitCustomPrice = get(takeProfitPriceAtom);

  const symbol = createSymbol({
    baseCurrency: perpetualStatistics.baseCurrency,
    quoteCurrency: perpetualStatistics.quoteCurrency,
    poolSymbol: perpetualStatistics.poolName,
  });

  // const positionBySymbol = positions.find((position) => position.symbol === symbol);

  // const previousCollateralCC = !positionBySymbol ? 0 : positionBySymbol.collateralCC;
  const collateral = !collateralDeposit ? 0 : collateralDeposit;

  let leverage = leverageSaved;
  if (keepPositionLeverage) {
    leverage = newPositionRisk?.leverage ?? 0;
  }

  let tradingFee = null;
  if (poolFee) {
    tradingFee = poolFee / 10;
    if (stopLoss !== StopLossE.None && takeProfit !== TakeProfitE.None) {
      tradingFee = tradingFee * 3;
    } else if (stopLoss !== StopLossE.None || takeProfit !== TakeProfitE.None) {
      tradingFee = tradingFee * 2;
    }
  }

  let maxMinEntryPrice = null;
  if (orderType === OrderTypeE.Market) {
    maxMinEntryPrice =
      perpetualStatistics.midPrice * (1 + mapSlippageToNumber(slippage) * (OrderBlockE.Short === orderBlock ? -1 : 1));
  }

  let stopLossPrice = null;
  if (stopLoss !== StopLossE.None && stopLoss !== null) {
    const stopLossMultiplier =
      1 - ((orderBlock === OrderBlockE.Long ? 1 : -1) * Math.abs(mapStopLossToNumber(stopLoss))) / leverage;

    if (orderType === OrderTypeE.Market && maxMinEntryPrice) {
      stopLossPrice = perpetualStatistics.markPrice * stopLossMultiplier;
    } else if (orderType === OrderTypeE.Limit && limitPrice) {
      stopLossPrice = limitPrice * stopLossMultiplier;
    } else if (orderType === OrderTypeE.Stop) {
      if (limitPrice !== null && limitPrice > -1) {
        stopLossPrice = limitPrice * stopLossMultiplier;
      } else {
        stopLossPrice = triggerPrice * stopLossMultiplier;
      }
    }
  } else if (stopLoss === null && stopLossCustomPrice !== null) {
    stopLossPrice = stopLossCustomPrice;
  }

  let takeProfitPrice = null;
  if (takeProfit !== TakeProfitE.None && takeProfit !== null) {
    const takeProfitMultiplier =
      // (1 + mapTakeProfitToNumber(takeProfit) * (orderBlock === OrderBlockE.Long ? 1 : -1)) / leverage;
      1 + ((orderBlock === OrderBlockE.Long ? 1 : -1) * mapTakeProfitToNumber(takeProfit)) / leverage;

    if (orderType === OrderTypeE.Market && maxMinEntryPrice) {
      takeProfitPrice = perpetualStatistics.markPrice * takeProfitMultiplier;
    } else if (orderType === OrderTypeE.Limit && limitPrice) {
      takeProfitPrice = limitPrice * takeProfitMultiplier;
    } else if (orderType === OrderTypeE.Stop) {
      if (limitPrice !== null && limitPrice > -1) {
        takeProfitPrice = limitPrice * takeProfitMultiplier;
      } else {
        takeProfitPrice = triggerPrice * takeProfitMultiplier;
      }
    }
  } else {
    takeProfitPrice = takeProfitCustomPrice;
  }

  return {
    symbol,
    poolName: perpetualStatistics.poolName,
    baseCurrency: perpetualStatistics.baseCurrency,
    quoteCurrency: perpetualStatistics.quoteCurrency,
    orderBlock,
    orderType,
    leverage,
    size,
    midPrice: perpetualStatistics.midPrice,
    tradingFee,
    collateral,
    maxMinEntryPrice,
    keepPositionLeverage,
    reduceOnly: orderType !== OrderTypeE.Market ? reduceOnly : null,
    expireDays: orderType !== OrderTypeE.Market ? expireDays : null,
    limitPrice: orderType !== OrderTypeE.Market ? limitPrice : null,
    triggerPrice: orderType === OrderTypeE.Stop ? triggerPrice : null,
    stopLoss,
    stopLossPrice,
    takeProfit,
    takeProfitPrice,
  };
});

export const clearInputsDataAtom = atom(null, (_get, set) => {
  // TODO: Check it if really required
  set(orderTypeValueAtom, OrderTypeE.Market);

  set(orderSizeAtom, 0);
  set(inputValueAtom, '0');
  set(setLeverageAtom, 1);
  set(limitPriceValueAtom, -1);
  set(triggerPriceValueAtom, 0);
  set(keepPositionLeverageAtom, false);
  set(reduceOnlyAtom, false);
  set(expireDaysAtom, Number(ExpiryE['90D']));
  set(stopLossAtom, StopLossE.None);
  set(takeProfitAtom, TakeProfitE.None);
});

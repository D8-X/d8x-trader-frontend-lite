import { TraderInterface } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';

import { poolsAtom, traderAPIAtom } from 'store/pools.store';
import type { OpenTraderRebateI, PoolWithIdI } from 'types/types';

const getPoolUsdPrice = async (traderAPI: TraderInterface, pool: PoolWithIdI) => {
  const info = await traderAPI.getPriceInUSD(
    `${pool.perpetuals[0].baseCurrency}-${pool.perpetuals[0].quoteCurrency}-${pool.poolSymbol}`
  );
  const priceInUsd = info.get(`${pool.perpetuals[0].baseCurrency}-USD`);
  if (priceInUsd) {
    const quotePrice = priceInUsd / pool.perpetuals[0].indexPrice;
    return { collateral: pool.perpetuals[0].collToQuoteIndexPrice * quotePrice, quote: quotePrice };
  }
  return { collateral: 0, quote: 0 };
};

const getBaseUSDPrice = async (traderAPI: TraderInterface, pool: PoolWithIdI) => {
  const basePricesMap: Record<string, number> = {};

  for (const perpetual of pool.perpetuals) {
    const info = await traderAPI.getPriceInUSD(
      `${perpetual.baseCurrency}-${perpetual.quoteCurrency}-${pool.poolSymbol}`
    );
    basePricesMap[perpetual.baseCurrency] = info.get(`${perpetual.baseCurrency}-USD`) || 0;
  }
  return basePricesMap;
};

interface PoolUsdPriceI {
  collateral: number;
  quote: number;
  bases: Record<string, number>;
}

export const poolUsdPriceAtom = atom<Record<string, PoolUsdPriceI>>({});
export const totalReferralRewardsAtom = atom(0);

export const poolUsdPriceMapAtom = atom(null, async (get, set, openRewards: OpenTraderRebateI[]) => {
  const traderAPI = get(traderAPIAtom);
  if (!traderAPI) {
    set(poolUsdPriceAtom, {});
    set(totalReferralRewardsAtom, 0);
    return;
  }

  const pools = get(poolsAtom).filter((pool) => pool.isRunning);

  const poolUsdPriceMap: Record<string, PoolUsdPriceI> = {};
  let totalReferralRewards = 0;

  for (const pool of pools) {
    const poolUSDPrice = await getPoolUsdPrice(traderAPI, pool);
    const baseUSDPrice = await getBaseUSDPrice(traderAPI, pool);
    poolUsdPriceMap[pool.poolSymbol] = {
      collateral: poolUSDPrice.collateral,
      quote: poolUSDPrice.quote,
      bases: baseUSDPrice,
    };

    const openRewardsAmount = openRewards
      .filter((volume) => volume.poolId === pool.poolId)
      .reduce((accumulator, currentValue) => accumulator + currentValue.earnings, 0);
    totalReferralRewards += openRewardsAmount * poolUSDPrice.collateral;
  }

  set(poolUsdPriceAtom, poolUsdPriceMap);
  set(totalReferralRewardsAtom, totalReferralRewards);
});

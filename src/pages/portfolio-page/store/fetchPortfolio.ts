import { TraderInterface } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';
import { Address } from 'viem';

import { poolsAtom, traderAPIAtom } from 'store/pools.store';
import { OpenTraderRebateI, PoolWithIdI } from 'types/types';

import { fetchEarningsAtom } from './fetchEarnings';
import { fetchPoolShareAtom } from './fetchPoolShare';
import { fetchPoolTokensUSDBalanceAtom } from './fetchPoolTokensUSDBalance';
import { fetchRealizedPnLAtom } from './fetchRealizedPnL';
import { fetchUnrealizedPnLAtom } from './fetchUnrealizedPnL';
import { fetchStrategySyntheticPosition } from './fetchStrategySyntheticPosition';

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
export const totalOpenRewardsAtom = atom(0);
export const accountValueAtom = atom(0);

export const fetchPortfolioAtom = atom(
  null,
  async (get, set, userAddress: Address, chainId: number, openRewards: OpenTraderRebateI[]) => {
    const traderAPI = get(traderAPIAtom);
    if (!traderAPI) {
      return;
    }

    const pools = get(poolsAtom).filter((pool) => pool.isRunning);

    let totalReferralRewards = 0;

    const poolUsdPriceMap: Record<string, PoolUsdPriceI> = {};

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

    set(totalOpenRewardsAtom, totalReferralRewards);

    const [unrealizedPnL, , strategySyntheticPositionUSD, poolTokensUSDBalance, , poolShareTokensUSDBalance] =
      await Promise.all([
        set(fetchUnrealizedPnLAtom, userAddress, chainId),
        set(fetchRealizedPnLAtom, userAddress, chainId),
        set(fetchStrategySyntheticPosition, userAddress, chainId),
        set(fetchPoolTokensUSDBalanceAtom, userAddress),
        set(fetchEarningsAtom, userAddress, chainId),
        set(fetchPoolShareAtom, userAddress),
      ]);

    let totalCollateralCC = 0;
    let totalUnrealizedPnl = 0;
    if (unrealizedPnL) {
      totalCollateralCC = unrealizedPnL.totalCollateralCC;
      totalUnrealizedPnl = unrealizedPnL.totalUnrealizedPnl;
    }

    const accountValue =
      poolTokensUSDBalance +
      totalCollateralCC +
      totalUnrealizedPnl +
      (poolShareTokensUSDBalance || 0) +
      (strategySyntheticPositionUSD || 0) +
      totalReferralRewards;

    set(accountValueAtom, accountValue);
  }
);

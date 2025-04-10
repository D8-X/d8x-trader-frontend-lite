import { multicall } from '@wagmi/core';
import { atom } from 'jotai';
import { type Address, erc20Abi } from 'viem';

import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { collateralToSettleConversionAtom, flatTokenAtom, poolsAtom } from 'store/pools.store';

import { poolUsdPriceAtom } from './fetchTotalReferralsRewards';
import { flatTokenAbi } from 'blockchain-api/contract-interactions/flatTokenAbi';

export const poolTokensUSDBalanceAtom = atom(0);

export const fetchPoolTokensUSDBalanceAtom = atom(null, async (get, set, userAddress: Address) => {
  const poolUsdPrice = get(poolUsdPriceAtom);
  if (Object.keys(poolUsdPrice).length === 0 || !userAddress) {
    return;
  }

  try {
    const pools = get(poolsAtom);
    if (!pools.length) return;

    const c2s = get(collateralToSettleConversionAtom);
    const flatToken = get(flatTokenAtom);

    const [poolTokensBalances, poolTokensDecimals] = await Promise.all([
      multicall(wagmiConfig, {
        contracts: pools.map((pool) => ({
          address: pool.settleTokenAddr as Address,
          abi: flatTokenAbi,
          functionName: flatToken?.poolId === pool.poolId ? 'effectiveBalanceOf' : 'balanceOf',
          args: [userAddress],
        })),
      }),
      multicall(wagmiConfig, {
        contracts: pools.map((pool) => ({
          address: pool.settleTokenAddr as Address,
          abi: erc20Abi,
          functionName: 'decimals',
        })),
      }),
    ]);

    const poolTokensUSDBalance = poolTokensBalances.reduce((acc, balance, index) => {
      if (balance.result && poolTokensDecimals[index].result) {
        // eslint-disable-next-line
        // @ts-ignore
        const tokenBalance = Number(balance.result) / 10 ** poolTokensDecimals[index].result;
        const px = c2s.get(pools[index].poolSymbol)?.value ?? 1;
        return acc + (tokenBalance / px) * poolUsdPrice[pools[index].poolSymbol].collateral; // SC to CC to USD
      }
      return acc;
    }, 0);

    if (poolTokensUSDBalance > 0) {
      set(poolTokensUSDBalanceAtom, poolTokensUSDBalance);
    }
  } catch (error) {
    console.error('Error calculating pool tokens USD balance:', error);
  }
});

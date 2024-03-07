import { multicall } from '@wagmi/core';
import { atom } from 'jotai';
import { Address } from 'viem';
import { erc20ABI } from 'wagmi';

import { poolsAtom } from 'store/pools.store';

import { poolUsdPriceAtom } from './fetchPortfolio';

export const poolTokensUSDBalanceAtom = atom(0);
export const fetchPoolTokensUSDBalanceAtom = atom(null, async (get, set, userAddress: Address) => {
  const pools = get(poolsAtom);
  const poolUsdPrice = get(poolUsdPriceAtom);

  const [poolTokensBalances, poolTokensDecimals] = await Promise.all([
    multicall({
      contracts: pools.map((pool) => ({
        address: pool.marginTokenAddr as Address,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      })),
    }),
    multicall({
      contracts: pools.map((pool) => ({
        address: pool.marginTokenAddr as Address,
        abi: erc20ABI,
        functionName: 'decimals',
      })),
    }),
  ]);

  const poolTokensUSDBalance = poolTokensBalances.reduce((acc, balance, index) => {
    if (balance.result && poolTokensDecimals[index].result) {
      // eslint-disable-next-line
      // @ts-ignore
      const tokenBalance = Number(balance.result) / 10 ** poolTokensDecimals[index].result;
      return acc + tokenBalance * poolUsdPrice[pools[index].poolSymbol].collateral;
    }
    return acc;
  }, 0);
  set(poolTokensUSDBalanceAtom, poolTokensUSDBalance);
  return poolTokensUSDBalance;
});

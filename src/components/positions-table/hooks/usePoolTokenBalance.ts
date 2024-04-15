import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { traderAPIAtom } from 'store/pools.store';
import { PoolWithIdI } from 'types/types';

interface PoolTokenBalancePropsI {
  poolByPosition?: PoolWithIdI | null;
}

export const usePoolTokenBalance = ({ poolByPosition }: PoolTokenBalancePropsI) => {
  const { address, chain, isConnected } = useAccount();

  const traderAPI = useAtomValue(traderAPIAtom);

  const [poolTokenBalance, setPoolTokenBalance] = useState<number>();
  const [poolTokenDecimals, setPoolTokenDecimals] = useState<number>();

  const {
    data: poolTokenBalanceData,
    isError,
    refetch,
  } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: poolByPosition?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: poolByPosition?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled: address && traderAPI?.chainId === chain?.id && !!poolByPosition?.marginTokenAddr && isConnected,
    },
  });

  useEffect(() => {
    if (address && chain) {
      refetch().then().catch(console.error);
    }
  }, [address, chain, refetch]);

  useEffect(() => {
    if (poolTokenBalanceData && chain && !isError) {
      setPoolTokenBalance(+formatUnits(poolTokenBalanceData[0], poolTokenBalanceData[1]));
      setPoolTokenDecimals(poolTokenBalanceData[1]);
    } else {
      setPoolTokenBalance(undefined);
      setPoolTokenDecimals(undefined);
    }
  }, [chain, poolTokenBalanceData, isError]);

  return {
    poolTokenBalance,
    poolTokenDecimals,
  };
};

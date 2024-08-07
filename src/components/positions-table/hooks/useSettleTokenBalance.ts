import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { traderAPIAtom } from 'store/pools.store';
import { PoolWithIdI } from 'types/types';

interface SettleTokenBalancePropsI {
  poolByPosition?: PoolWithIdI | null;
}

export const useSettleTokenBalance = ({ poolByPosition }: SettleTokenBalancePropsI) => {
  const { address, chain, isConnected } = useAccount();

  const traderAPI = useAtomValue(traderAPIAtom);

  const [settleTokenBalance, setSettleTokenBalance] = useState<number>();
  const [settleTokenDecimals, setSettleTokenDecimals] = useState<number>();

  const {
    data: settleTokenBalanceData,
    isError,
    refetch,
  } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: poolByPosition?.settleTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: poolByPosition?.settleTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled: address && Number(traderAPI?.chainId) === chain?.id && !!poolByPosition?.settleTokenAddr && isConnected,
    },
  });

  useEffect(() => {
    if (address && chain) {
      refetch().then().catch(console.error);
    }
  }, [address, chain, refetch]);

  useEffect(() => {
    if (settleTokenBalanceData && chain && !isError) {
      setSettleTokenBalance(+formatUnits(settleTokenBalanceData[0], settleTokenBalanceData[1]));
      setSettleTokenDecimals(settleTokenBalanceData[1]);
    } else {
      setSettleTokenBalance(undefined);
      setSettleTokenDecimals(undefined);
    }
  }, [chain, settleTokenBalanceData, isError]);

  return {
    settleTokenBalance,
    settleTokenDecimals,
  };
};

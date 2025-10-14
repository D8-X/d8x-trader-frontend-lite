import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { flatTokenAbi } from 'blockchain-api/abi/flatTokenAbi';
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
    allowFailure: true,
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
      {
        address: poolByPosition?.settleTokenAddr as Address,
        abi: flatTokenAbi,
        functionName: 'effectiveBalanceOf',
        args: [address as Address],
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
    if (settleTokenBalanceData && chain && !isError && settleTokenBalanceData[1].status === 'success') {
      if (settleTokenBalanceData[0].status === 'success') {
        setSettleTokenBalance(+formatUnits(settleTokenBalanceData[0].result, settleTokenBalanceData[1].result));
      }
      if (settleTokenBalanceData[2].status === 'success') {
        setSettleTokenBalance(+formatUnits(settleTokenBalanceData[2].result, settleTokenBalanceData[1].result));
      }
      setSettleTokenDecimals(settleTokenBalanceData[1].result);
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

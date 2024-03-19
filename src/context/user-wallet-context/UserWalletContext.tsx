import { useAtomValue } from 'jotai';
import { createContext, memo, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { GetBalanceReturnType, getGasPrice as getGasPriceWagmi } from '@wagmi/core';

import { REFETCH_BALANCES_INTERVAL } from 'appConstants';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { traderAPIAtom } from 'store/pools.store';
import { MethodE } from 'types/enums';

interface UserWalletContextPropsI {
  gasTokenBalance: GetBalanceReturnType | undefined;
  isGasTokenFetchError: boolean;
  hasEnoughGas: (method: MethodE, multiplier: bigint) => boolean;
  refetchWallet: () => void;
}

const UserWalletContext = createContext<UserWalletContextPropsI | undefined>(undefined);

export const UserWalletProvider = memo(({ children }: PropsWithChildren) => {
  const { chain, address, isConnected, isReconnecting, isConnecting } = useAccount();

  const traderAPI = useAtomValue(traderAPIAtom);

  const [gasPrice, setGasPrice] = useState(0n);

  const {
    data: gasTokenBalance,
    refetch: gasTokenBalanceRefetch,
    isError: isGasTokenFetchError,
  } = useBalance({
    address,
    query: { enabled: address && traderAPI?.chainId === chain?.id && isConnected && !isReconnecting && !isConnecting },
  });

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const intervalId = setInterval(() => {
      gasTokenBalanceRefetch().then();
    }, REFETCH_BALANCES_INTERVAL);
    return () => {
      clearInterval(intervalId);
    };
  }, [gasTokenBalanceRefetch, isConnected]);

  useEffect(() => {
    if (chain?.id && address && isConnected) {
      getGasPrice(chain.id).then((proposedGasPrice) => {
        if (!proposedGasPrice) {
          getGasPriceWagmi(wagmiConfig, { chainId: chain.id }).then((gasPriceFromWagmi) => {
            setGasPrice(gasPriceFromWagmi);
          });
        } else {
          setGasPrice(proposedGasPrice);
        }
      });
    } else {
      setGasPrice(0n);
    }
  }, [address, chain?.id, isConnected]);

  const hasEnoughGas = useCallback(
    (method: MethodE, multiplier: bigint) => {
      if (chain?.id && gasPrice > 0n && gasTokenBalance && gasTokenBalance.value > 0n) {
        const gasLimit = getGasLimit({ chainId: chain.id, method });
        return gasPrice * gasLimit * multiplier < gasTokenBalance.value;
      }
      return false;
    },
    [gasPrice, chain?.id, gasTokenBalance]
  );

  const handleWalletRefetch = useCallback(() => {
    gasTokenBalanceRefetch().then();
  }, [gasTokenBalanceRefetch]);

  return (
    <UserWalletContext.Provider
      value={{
        gasTokenBalance,
        isGasTokenFetchError,
        hasEnoughGas,
        refetchWallet: handleWalletRefetch,
      }}
    >
      {children}
    </UserWalletContext.Provider>
  );
});

export const useUserWallet = () => {
  const context = useContext(UserWalletContext);
  if (!context) {
    throw new Error('useUserWallet must be used within a UserWalletContext');
  }
  return {
    ...context,
  };
};

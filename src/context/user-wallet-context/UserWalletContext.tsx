import { useAtomValue } from 'jotai';
import { createContext, memo, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAccount, useBalance, useBytecode } from 'wagmi';
import { GetBalanceReturnType, getGasPrice as getGasPriceWagmi } from '@wagmi/core';

import { REFETCH_BALANCES_INTERVAL } from 'appConstants';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { activatedOneClickTradingAtom, tradingClientAtom } from 'store/app.store';
import { traderAPIAtom } from 'store/pools.store';
import { MethodE } from 'types/enums';

interface UserWalletContextPropsI {
  gasTokenBalance: GetBalanceReturnType | undefined;
  isConnected: boolean;
  isGasTokenFetchError: boolean;
  isMultisigAddress: boolean | null;
  hasEnoughGasForFee: (method: MethodE, multiplier: bigint) => boolean;
  calculateGasForFee: (method: MethodE, multiplier: bigint) => bigint;
  refetchWallet: () => void;
}

const UserWalletContext = createContext<UserWalletContextPropsI | undefined>(undefined);

export const UserWalletProvider = memo(({ children }: PropsWithChildren) => {
  const { chain, address, isConnected, isReconnecting, isConnecting } = useAccount();

  const traderAPI = useAtomValue(traderAPIAtom);
  const oneClickTradingActivated = useAtomValue(activatedOneClickTradingAtom);
  const tradingClient = useAtomValue(tradingClientAtom);

  const [gasPrice, setGasPrice] = useState(0n);
  const [isMultisigAddress, setMultisigAddress] = useState<boolean | null>(null);

  const isMultisigRefetchRef = useRef(false);

  const tradingAddress = oneClickTradingActivated ? tradingClient?.account?.address : address;

  const {
    data: gasTokenBalance,
    refetch: gasTokenBalanceRefetch,
    isError: isGasTokenFetchError,
  } = useBalance({
    address: tradingAddress,
    query: {
      enabled:
        tradingAddress && Number(traderAPI?.chainId) === chain?.id && isConnected && !isReconnecting && !isConnecting,
    },
  });

  const { data: multisigData, refetch } = useBytecode({
    address: tradingAddress,
  });

  useEffect(() => {
    if (isMultisigRefetchRef.current || !address) {
      return;
    }

    isMultisigRefetchRef.current = true;
    refetch().finally(() => {
      isMultisigRefetchRef.current = false;
    });
    return () => {
      isMultisigRefetchRef.current = false;
    };
  }, [address, refetch]);

  useEffect(() => {
    if (multisigData === undefined) {
      setMultisigAddress(null);
      return;
    }
    setMultisigAddress(multisigData !== null && multisigData !== '0x');
  }, [multisigData]);

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

  const calculateGasForFee = useCallback(
    (method: MethodE, multiplier: bigint) => {
      if (chain?.id && gasPrice > 0n) {
        const gasLimit = getGasLimit({ chainId: chain.id, method });
        return gasPrice * gasLimit * multiplier;
      }
      return 0n;
    },
    [gasPrice, chain?.id]
  );

  const hasEnoughGasForFee = useCallback(
    (method: MethodE, multiplier: bigint) => {
      const gasForFee = calculateGasForFee(method, multiplier);
      if (gasForFee > 0n && gasTokenBalance && gasTokenBalance.value > 0n) {
        return gasForFee < gasTokenBalance.value;
      }
      return false;
    },
    [calculateGasForFee, gasTokenBalance]
  );

  const handleWalletRefetch = useCallback(() => {
    gasTokenBalanceRefetch().then();
  }, [gasTokenBalanceRefetch]);

  return (
    <UserWalletContext.Provider
      value={{
        gasTokenBalance,
        isConnected,
        isGasTokenFetchError,
        isMultisigAddress,
        hasEnoughGasForFee,
        calculateGasForFee,
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

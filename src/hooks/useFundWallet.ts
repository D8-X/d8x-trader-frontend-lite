import { useFundWallet } from '@privy-io/react-auth';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { smartAccountClientAtom } from 'store/app.store';
import { isUserRejectedError } from 'utils/error';
import { Transaction } from 'viem';
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

// 1) prompt user to get USDC into Base, with a min threshold
// 2) watch for USDC funds in Base, and if threshold is crossed, bridge to target chain

const BASE_USDC_ADDR = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

export const useFundAccount = () => {
  const { fundWallet } = useFundWallet();

  const smartAccountClient = useAtomValue(smartAccountClientAtom);

  const [isPending, setPending] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<Transaction | undefined>();

  const { address } = useAccount();

  const targetAddress = useMemo(() => {
    return smartAccountClient?.account?.address ?? address;
  }, [smartAccountClient, address]);

  const bridgeBaseUsdc = async (targetChainId: string | number | bigint) => {
    // TODO: send entire USDC balance to target chain
    // https://docs.biconomy.io/new/integration-guides/bridges-and-solvers/integrate-lifi
    //
  };

  const getBaseUsdc = async (amount: string, chainId: string | number | bigint) => {
    if (isPending || !targetAddress || isNaN(+amount)) {
      return;
    }

    setPending(true);
    setSuccess(false);
    setError(undefined);
    setData(undefined);

    try {
      fundWallet({
        address: targetAddress,
        options: { chain: base, asset: { erc20: BASE_USDC_ADDR }, amount },
      })
        .then(() => {
          console.log('fund erc20 complete');
        })
        .catch((e) => {
          console.log('error funding erc20', e);
        });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setSuccess(false);
      if (!isUserRejectedError(err)) {
        setError('Something went wrong');
      }
    } finally {
      setPending(false);
    }
  };
  return { getBaseUsdc, isPending, isSuccess, error, data };
};

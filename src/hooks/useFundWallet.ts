import { useFundWallet } from '@privy-io/react-auth';
import { BASE_USDC_ADDRESS } from 'blockchain-api/constants';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useState } from 'react';
import { authorization7702Atom, meeClientAtom, smartAccountClientAtom } from 'store/app.store';
import { isUserRejectedError } from 'utils/error';
import { Transaction } from 'viem';
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

// 1) prompt user to get USDC into Base, with a min threshold
// 2) watch for USDC funds in Base, and if threshold is crossed, bridge to target chain

export const useFundAccount = () => {
  const { fundWallet } = useFundWallet();

  const smartAccountClient = useAtomValue(smartAccountClientAtom);
  const meeClient = useAtomValue(meeClientAtom);
  const authorization = useAtomValue(authorization7702Atom);

  const [isPending, setPending] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<Transaction | undefined>();

  const { address } = useAccount();

  const targetAddress = useMemo(() => {
    return smartAccountClient?.account?.address ?? address;
  }, [smartAccountClient, address]);

  const bridgeBaseUsdc = useCallback(async () => {
    if (!meeClient || !authorization) {
      // TODO: send entire USDC balance to target chain, only if target !== base
      // bridgeAndApprove({meeClient, authorization})
    }
  }, [meeClient, authorization]);

  const getBaseUsdc = async (amount: string) => {
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
        options: { chain: base, asset: { erc20: BASE_USDC_ADDRESS }, amount },
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
  return { getBaseUsdc, bridgeBaseUsdc, isPending, isSuccess, error, data };
};

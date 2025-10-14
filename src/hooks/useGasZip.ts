import { useWallets } from '@privy-io/react-auth';
import { useState } from 'react';
import { encodeGasZip } from 'utils/encodeGasZip';
import { isUserRejectedError } from 'utils/error';
import { toHex, Transaction } from 'viem';
import { useAccount } from 'wagmi';

// https://dev.gas.zip/gas/chain-support/outbound
const GASZIP_HYPEREVM_ID = 430;

// Inbound: Contract Forwarder in https://dev.gas.zip/gas/chain-support/inbound#direct-deposit
const GASZIP_DEPOSIT_ADDR = '0x391E7C679d29bD940d63be94AD22A25d25b5A604' as `0x${string}`;

export const useGasZip = () => {
  const [isPending, setPending] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<
    | {
        chainId: `0x${string}`;
        from: `0x${string}`;
        to: `0x${string}`;
        data: `0x${string}`;
        gasLimit: `0x${string}`;
        value: `0x${string}`;
      }
    | Transaction
    | undefined
  >();

  const { address } = useAccount();
  const { wallets } = useWallets();

  const wallet = wallets?.find((w) => w.connectorType !== 'embedded'); // metamask

  const bridgeGas = async (amount: bigint, chainId: string | number | bigint) => {
    if (!address || isPending || !wallet?.address) {
      return;
    }

    setPending(true);
    setSuccess(false);
    setError(undefined);
    setData(undefined);

    try {
      const transaction = {
        chainId: toHex(chainId),
        from: wallet.address as `0x${string}`,
        to: GASZIP_DEPOSIT_ADDR,
        data: encodeGasZip(address, GASZIP_HYPEREVM_ID),
        gasLimit: toHex(100_000),
        value: toHex(amount),
      };

      setData(transaction);

      wallet.switchChain(transaction.chainId);

      const hash = await wallet.sign(JSON.stringify(transaction));
      console.log({ hash });

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
  return { bridgeGas, isPending, isSuccess, error, data };
};

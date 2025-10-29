import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { formatUnits, parseUnits } from 'viem/utils';
import { useBalance, useReadContract, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button } from '@mui/material';

import { ToastContent } from 'components/toast-content/ToastContent';

import { useSendTransaction } from '@privy-io/react-auth';
import { mockSwap } from 'blockchain-api/contract-interactions/mockSwap';
import { useAtomValue } from 'jotai';
import { selectedPoolAtom } from 'store/pools.store';
import { MockSwapConfigI } from 'types/types';
import { Address, Hex } from 'viem';
import { SWAP_ABI, TOKEN_SWAPS } from './constants';
import styles from './MockSwap.module.scss';

export function MockSwap() {
  // constants: could be made into states
  const selectedPool = useAtomValue(selectedPoolAtom);
  const nativeTokenAmount = '0.001';

  const { data: wallet } = useWalletClient();
  const { data: nativeToken } = useBalance({
    address: wallet?.account?.address,
  });

  const chainId = wallet?.chain?.id;

  const { sendTransaction } = useSendTransaction();

  const [swapTxn, setSwapTxn] = useState<Hex | undefined>();

  const inActionRef = useRef(false);

  const marginTokenDecimals = useMemo(() => {
    return TOKEN_SWAPS.find((config: MockSwapConfigI) => config.chainId === wallet?.chain?.id)?.pools.find(
      ({ marginToken }) => marginToken === selectedPool?.settleSymbol
    )?.decimals;
  }, [wallet, selectedPool?.settleSymbol]);

  const swapAddress = useMemo(() => {
    return TOKEN_SWAPS.find((config: MockSwapConfigI) => config.chainId === wallet?.chain?.id)?.pools.find(
      ({ marginToken }) => marginToken === selectedPool?.settleSymbol
    )?.marginTokenSwap;
  }, [wallet, selectedPool?.settleSymbol]);

  const depositAmountUnits = parseUnits(nativeTokenAmount, 18);
  // useMemo(() => {
  //   return nativeToken ? parseUnits(nativeTokenAmount, nativeToken.decimals) : undefined;
  // }, [nativeToken, nativeTokenAmount]);

  const { data: tokenAmountUnits } = useReadContract({
    address: swapAddress as `0x${string}` | undefined,
    abi: [...SWAP_ABI],
    chainId: wallet?.chain?.id,
    query: {
      enabled:
        wallet?.chain !== undefined && wallet?.account?.address !== undefined && depositAmountUnits !== undefined,
      refetchInterval: 10_000,
    },
    functionName: 'getAmountToReceive',
    args: [wallet?.account?.address as `0x${string}`, depositAmountUnits as bigint],
  });

  const tokenAmount = useMemo(() => {
    if (tokenAmountUnits !== undefined && marginTokenDecimals !== undefined) {
      return formatUnits(tokenAmountUnits, marginTokenDecimals);
    }
    return '';
  }, [tokenAmountUnits, marginTokenDecimals]);

  const {
    isSuccess: isSwapSuccess,
    isError: isSwapError,
    isFetched: isSwapFetched,
    error: swapError,
  } = useWaitForTransactionReceipt({
    hash: swapTxn,
    query: { enabled: !!swapTxn || inActionRef.current },
  });

  useEffect(() => {
    if (isSwapFetched) {
      setSwapTxn(undefined);
    }
  }, [isSwapFetched]);

  useEffect(() => {
    if (isSwapSuccess) {
      toast.success(
        <ToastContent
          title="Success"
          bodyLines={[
            {
              label: '',
              value: `You have successfully obtained ${selectedPool?.settleSymbol}!`,
            },
          ]}
        />
      );
    }
  }, [isSwapSuccess, selectedPool?.settleSymbol]);

  useEffect(() => {
    if (isSwapError) {
      toast.error(<ToastContent title="Error" bodyLines={[{ label: 'Reason:', value: swapError.message }]} />);
    }
  }, [isSwapError, swapError]);

  const onClick = () => {
    if (!inActionRef.current && swapAddress !== undefined && chainId !== undefined) {
      inActionRef.current = true;
      mockSwap(chainId, sendTransaction, swapAddress as Address)
        .then(({ hash }) => setSwapTxn(hash))
        .catch((e) => {
          console.log(e);
          if (`${e}`.includes('0x97a6a343')) {
            // hack: Timelocked error code is constant, could also parse seconds left?
            toast.error(<ToastContent title="Timelocked" bodyLines={[{ label: 'Daily Limit', value: '' }]} />);
          }
        })
        .finally(() => (inActionRef.current = false));
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.row}>
        <Button
          variant="primary"
          onClick={onClick}
          className={styles.swapButton}
          disabled={
            // !swapConfig?.request ||
            // !nativeToken?.value ||
            !depositAmountUnits ||
            // depositAmountUnits > nativeToken?.value ||
            // isLoading ||
            inActionRef.current
          }
        >
          {`Get ${selectedPool?.settleSymbol}`}
        </Button>
      </div>
      {Number(tokenAmount) >= 10_000 && (
        <div className={styles.row}>
          <div className={styles.text}>
            Swap 0.001 {nativeToken?.symbol} for {tokenAmount} {selectedPool?.settleSymbol}
          </div>
        </div>
      )}
      {/* {wallet &&
        nativeToken &&
        !!depositAmountUnits &&
        depositAmountUnits > 0n &&
        nativeToken.value < depositAmountUnits && (
          <div className={`${styles.row} ${styles.applyMax}`}>
            <Typography className={styles.helperTextWarning} variant="bodyTiny">
              Insufficient funds: {formatUnits(nativeToken.value, nativeToken.decimals)} {nativeToken.symbol} - Get test{' '}
              {nativeToken.symbol} from{' '}
              <a
                href={'https://bartio.faucet.berachain.com/'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                the official faucet
              </a>
            </Typography>
          </div>
        )} */}
    </div>
  );
}

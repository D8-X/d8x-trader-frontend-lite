import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { formatUnits, parseUnits } from 'viem/utils';
import {
  useBalance,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from 'wagmi';

import { Button } from '@mui/material';

import { ToastContent } from 'components/toast-content/ToastContent';

import { useAtomValue } from 'jotai';
import { selectedPoolAtom } from 'store/pools.store';
import { MockSwapConfigI } from 'types/types';
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

  const [inAction, setInAction] = useState(false);

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

  console.log({ tokenAmountUnits });

  const tokenAmount = useMemo(() => {
    if (tokenAmountUnits !== undefined && marginTokenDecimals !== undefined) {
      return formatUnits(tokenAmountUnits, marginTokenDecimals);
    }
    return '';
  }, [tokenAmountUnits, marginTokenDecimals]);

  const { data: swapTxn, writeContract: write, isPending: isLoading } = useWriteContract();

  const { data: swapConfig } = useSimulateContract({
    address: swapAddress as `0x${string}` | undefined,
    abi: SWAP_ABI,
    functionName: 'swapToMockToken',
    chainId: wallet?.chain?.id,
    gas: BigInt(1_000_000),
    value: depositAmountUnits,
    query: { enabled: depositAmountUnits !== undefined && tokenAmountUnits !== undefined && tokenAmountUnits > 0n },
  });

  console.log({
    swapConfig,
    swapAddress,
    depositAmountUnits,
    tokenAmount,
    marginTokenDecimals,
    enabled: wallet?.chain !== undefined && wallet?.account?.address !== undefined && depositAmountUnits !== undefined,
  });

  const {
    isSuccess: isSwapSuccess,
    isError: isSwapError,
    isFetched: isSwapFetched,
    error: swapError,
  } = useWaitForTransactionReceipt({
    hash: swapTxn,
    query: { enabled: !!swapTxn || inAction },
  });

  useEffect(() => {
    if (isSwapFetched) {
      setInAction(false);
    }
  }, [isSwapFetched, setInAction]);

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

  return (
    <div className={styles.section}>
      <div className={styles.row}>
        <Button
          variant="primary"
          onClick={() => {
            if (swapConfig?.request) {
              write?.(swapConfig.request);
              setInAction(true);
            }
          }}
          className={styles.swapButton}
          disabled={
            // !swapConfig?.request ||
            // !nativeToken?.value ||
            !depositAmountUnits ||
            // depositAmountUnits > nativeToken?.value ||
            isLoading ||
            inAction
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

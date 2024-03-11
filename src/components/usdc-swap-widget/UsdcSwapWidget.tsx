import { useTranslation } from 'react-i18next';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { formatUnits, parseUnits } from 'viem/utils';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from 'wagmi';

import { Button, Link, Typography } from '@mui/material';
import { South } from '@mui/icons-material';

import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import { OLD_USDC_ADDRESS, USDC_DECIMALS, ZK_NATIVE_CONVERTER_ABI, ZK_NATIVE_CONVERTER_ADDRESS } from './constants';

import styles from './UsdcSwapWidget.module.scss';
import { Address, erc20Abi } from 'viem';

export function UsdcSwapWidget() {
  const { t } = useTranslation();

  const { address, isConnected, chainId } = useAccount();
  const { data: wallet } = useWalletClient({ chainId: 1101 });

  const [depositAmount, setDepositAmount] = useState(0);
  const [inputValue, setInputValue] = useState(`${depositAmount}`);
  const [inAction, setInAction] = useState(false);

  const inputValueChangedRef = useRef(false);

  const { data: poolTokenBalance } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035',
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035',
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: { enabled: address && chainId === 1101 && isConnected },
  });

  const handleInputCapture = useCallback((orderSizeValue: string) => {
    if (orderSizeValue) {
      setDepositAmount(+orderSizeValue);
      setInputValue(orderSizeValue);
    } else {
      setDepositAmount(0);
      setInputValue('');
    }
    inputValueChangedRef.current = true;
  }, []);

  const depositAmountUnits = useMemo(() => {
    return !Number.isNaN(+inputValue) ? parseUnits(inputValue, USDC_DECIMALS) : 0n;
  }, [inputValue]);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: OLD_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    chainId: 1101,
    query: { enabled: chainId === 1101 },
    args: [wallet?.account.address as `0x${string}`, ZK_NATIVE_CONVERTER_ADDRESS],
  });

  const { data: approveConfig } = useSimulateContract({
    address: OLD_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'approve',
    chainId: 1101,
    query: { enabled: wallet !== undefined && allowance !== undefined && depositAmountUnits > 0 },
    args: [ZK_NATIVE_CONVERTER_ADDRESS, depositAmountUnits],
  });

  const {
    data: swapApproveTxn,
    writeContractAsync: approve,
    isPending: isApproveLoading,
    isSuccess: isApproved,
  } = useWriteContract();

  const { data: swapConfig } = useSimulateContract({
    address: ZK_NATIVE_CONVERTER_ADDRESS,
    abi: ZK_NATIVE_CONVERTER_ABI,
    functionName: 'convert',
    chainId: 1101,
    query: {
      enabled:
        address !== undefined && depositAmountUnits > 0n && allowance !== undefined && allowance >= depositAmountUnits,
    },
    args: [address as Address, depositAmountUnits, '0x'],
    gas: 160_000n,
  });

  const { data: swapExecuteTxn, writeContractAsync: execute, isPending: isExecuteLoading } = useWriteContract();

  const {
    isSuccess: isApproveSuccess,
    isError: isApproveError,
    isFetched: isApproveFetched,
    error: approveError,
  } = useWaitForTransactionReceipt({
    hash: swapApproveTxn,
  });

  useEffect(() => {
    if (!isApproveFetched) {
      return;
    }
    refetchAllowance?.().then();
  }, [isApproveFetched, refetchAllowance]);

  useEffect(() => {
    if (!isApproveError || !approveError) {
      return;
    }
    toast.error(<ToastContent title="Error" bodyLines={[{ label: 'Reason:', value: approveError.message }]} />);
  }, [isApproveError, approveError]);

  useEffect(() => {
    if (!isApproveSuccess && depositAmount > 0) {
      return;
    }
    toast.success(
      <ToastContent
        title="Success"
        bodyLines={[
          {
            label: '',
            value: `You have successfully approved SWAP from ${depositAmount} legacy USDC to ${depositAmount} new bridged USDC`,
          },
        ]}
      />
    );
  }, [isApproveSuccess, depositAmount]);

  const {
    isSuccess: isSwapSuccess,
    isError: isSwapError,
    isFetched: isSwapFetched,
    error: swapError,
  } = useWaitForTransactionReceipt({
    hash: swapExecuteTxn,
  });

  useEffect(() => {
    if (!isSwapFetched) {
      return;
    }
    setInAction(false);
  }, [isSwapFetched, setInAction]);

  useEffect(() => {
    if (!isSwapError || !swapError) {
      return;
    }
    toast.error(<ToastContent title="Error" bodyLines={[{ label: 'Reason:', value: swapError.message }]} />);
  }, [isSwapError, swapError]);

  useEffect(() => {
    if (!isSwapSuccess && depositAmount > 0) {
      return;
    }
    toast.success(
      <ToastContent
        title="Success"
        bodyLines={[
          {
            label: '',
            value: `You have successfully swapped from ${depositAmount} legacy USDC to ${depositAmount} new bridged USDC`,
          },
        ]}
      />
    );
    setDepositAmount(0);
    setInputValue('0');
  }, [isSwapSuccess, depositAmount, setDepositAmount, setInputValue]);

  const swap = async () => {
    if (allowance === undefined || depositAmountUnits <= 0n) {
      return;
    }
    setInAction(true);
    if (allowance < depositAmountUnits) {
      if (approveConfig?.request) {
        await approve?.(approveConfig?.request);
      }
    } else {
      if (swapConfig?.request) {
        await execute?.(swapConfig?.request);
      }
    }
  };

  useEffect(() => {
    if (isApproved && !!swapConfig?.request) {
      execute?.(swapConfig?.request).then();
    }
  }, [isApproved, swapConfig?.request, execute]);

  const handleInputBlur = useCallback(() => {
    if (poolTokenBalance && depositAmount > 0) {
      const maxAllowed = +formatUnits(poolTokenBalance[0], poolTokenBalance[1]);
      if (maxAllowed > 0 && depositAmount > maxAllowed) {
        setDepositAmount(+maxAllowed);
        setInputValue(formatUnits(poolTokenBalance[0], poolTokenBalance[1]));
      }
    }
  }, [poolTokenBalance, depositAmount]);

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <ResponsiveInput
          id="bridged-amount"
          className={styles.inputRoot}
          inputClassName={styles.inputClassName}
          inputValue={inputValue}
          setInputValue={handleInputCapture}
          handleInputBlur={handleInputBlur}
          currency={'legacy USDC'}
          step={'0.000001'}
          min={0.000001}
        />
      </div>
      {poolTokenBalance && (
        <div className={`${styles.row} ${styles.applyMax}`}>
          <Typography className={styles.helperText} variant="bodyTiny">
            {t('common.max')}{' '}
            <Link
              className={styles.addMaxLink}
              onClick={() => {
                handleInputCapture(formatUnits(poolTokenBalance[0], poolTokenBalance[1]));
              }}
            >
              {(+formatUnits(poolTokenBalance[0], poolTokenBalance[1])).toFixed(2)}
            </Link>
          </Typography>
        </div>
      )}
      <div className={styles.row}>
        <South />
      </div>
      <div className={styles.row}>
        <ResponsiveInput
          id="usdc-amount"
          className={styles.inputRoot}
          inputClassName={styles.inputClassName}
          inputValue={inputValue}
          disabled={true}
          setInputValue={() => ({})}
          currency={'USDC'}
          // step="1"
          // min={0}
          // max={poolTokenBalance || 999999}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.text}>
          {t('common.usdc-swap-widget.item1')}{' '}
          <a
            href="https://zkevm.polygonscan.com/token/0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035"
            target="_blank"
            rel="noreferrer"
          >
            USDC
          </a>{' '}
          {t('common.usdc-swap-widget.item2')}{' '}
          <a
            href="https://zkevm.polygonscan.com/token/0x37eAA0eF3549a5Bb7D431be78a3D99BD360d19e5"
            target="_blank"
            rel="noreferrer"
          >
            USDC
          </a>
          . {t('common.usdc-swap-widget.item3')}{' '}
          <a
            href="https://zkevm.polygonscan.com/address/0xd4F3531Fc95572D9e7b9e9328D9FEaa8e8496054#code"
            target="_blank"
            rel="noreferrer"
          >
            {t('common.usdc-swap-widget.item4')}
          </a>
          . {t('common.usdc-swap-widget.item5')}{' '}
          <a
            href="https://polygon.technology/blog/bridged-usdc-standard-contracts-are-live-on-polygon-zkevm"
            target="_blank"
            rel="noreferrer"
          >
            {t('common.usdc-swap-widget.item6')}
          </a>
          .
        </div>
      </div>
      <div className={styles.row}>
        <Button
          variant="primary"
          onClick={() => {
            swap().then();
          }}
          className={styles.swapButton}
          disabled={
            !isConnected ||
            depositAmountUnits < 1n ||
            poolTokenBalance?.[0] === 0n ||
            isApproveLoading ||
            isExecuteLoading ||
            inAction
          }
        >
          {t('common.usdc-swap-widget.swap')}
        </Button>
      </div>
    </div>
  );
}

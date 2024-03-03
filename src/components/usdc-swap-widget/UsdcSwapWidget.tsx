import { useTranslation } from 'react-i18next';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { parseUnits } from 'viem/utils';
import {
  Address,
  erc20ABI,
  useAccount,
  useBalance,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
  useWalletClient,
} from 'wagmi';

import { Button, Link, Typography } from '@mui/material';
import { South } from '@mui/icons-material';

import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import { OLD_USDC_ADDRESS, USDC_DECIMALS, ZK_NATIVE_CONVERTER_ABI, ZK_NATIVE_CONVERTER_ADDRESS } from './constants';

import styles from './UsdcSwapWidget.module.scss';

export function UsdcSwapWidget() {
  const { t } = useTranslation();

  const { address, isConnected } = useAccount();
  const { data: wallet } = useWalletClient({ chainId: 1101 });

  const [depositAmount, setDepositAmount] = useState(0);
  const [inputValue, setInputValue] = useState(`${depositAmount}`);
  const [inAction, setInAction] = useState(false);

  const inputValueChangedRef = useRef(false);

  const { data: poolTokenBalance } = useBalance({
    address,
    token: '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035',
    chainId: 1101,
    enabled: !!address && wallet?.chain?.id === 1101,
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

  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: OLD_USDC_ADDRESS,
    abi: erc20ABI,
    functionName: 'allowance',
    chainId: 1101,
    enabled: wallet?.chain?.id === 1101,
    args: [wallet?.account.address as `0x${string}`, ZK_NATIVE_CONVERTER_ADDRESS],
  });

  const { config: approveConfig } = usePrepareContractWrite({
    address: OLD_USDC_ADDRESS,
    abi: erc20ABI,
    functionName: 'approve',
    chainId: 1101,
    enabled: wallet !== undefined && allowance !== undefined && depositAmountUnits > 0,
    args: [ZK_NATIVE_CONVERTER_ADDRESS, depositAmountUnits],
  });

  const {
    data: swapApproveTxn,
    writeAsync: approve,
    isLoading: isApproveLoading,
    isSuccess: isApproved,
  } = useContractWrite(approveConfig);

  const { config: swapConfig } = usePrepareContractWrite({
    address: ZK_NATIVE_CONVERTER_ADDRESS,
    abi: ZK_NATIVE_CONVERTER_ABI,
    functionName: 'convert',
    chainId: 1101,
    enabled:
      address !== undefined && depositAmountUnits > 0n && allowance !== undefined && allowance >= depositAmountUnits,
    args: [address as Address, depositAmountUnits, '0x'],
    gas: 160_000n,
  });

  const { data: swapExecuteTxn, writeAsync: execute, isLoading: isExecuteLoading } = useContractWrite(swapConfig);

  useWaitForTransaction({
    hash: swapApproveTxn?.hash,
    onSuccess: () => {
      console.log('approve txn', swapApproveTxn?.hash);
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
    },
    onError: (reason) => {
      toast.error(<ToastContent title="Error" bodyLines={[{ label: 'Reason:', value: reason.message }]} />);
    },
    onSettled: () => {
      refetchAllowance?.().then();
    },
  });

  useWaitForTransaction({
    hash: swapExecuteTxn?.hash,
    onSuccess: () => {
      console.log('execute txn', swapExecuteTxn?.hash);

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
    },
    onError: (reason) => {
      toast.error(<ToastContent title="Error" bodyLines={[{ label: 'Reason:', value: reason.message }]} />);
    },
    onSettled: () => {
      setInAction(false);
    },
  });

  const swap = async () => {
    if (allowance === undefined || depositAmountUnits <= 0n) {
      return;
    }
    setInAction(true);
    if (allowance < depositAmountUnits) {
      await approve?.();
    } else {
      await execute?.();
    }
  };

  useEffect(() => {
    if (isApproved) {
      execute?.().then();
    }
  }, [isApproved, execute]);

  const handleInputBlur = useCallback(() => {
    if (poolTokenBalance && depositAmount > 0) {
      const maxAllowed = +poolTokenBalance.formatted;
      if (maxAllowed > 0 && depositAmount > maxAllowed) {
        setDepositAmount(+maxAllowed);
        setInputValue(poolTokenBalance.formatted);
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
                handleInputCapture(poolTokenBalance.formatted);
              }}
            >
              {(+poolTokenBalance.formatted).toFixed(2)}
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
            poolTokenBalance?.formatted === '0' ||
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

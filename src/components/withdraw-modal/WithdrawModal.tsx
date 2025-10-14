import { ERC20_ABI } from '@d8x/perpetuals-sdk';
import { writeContract } from '@wagmi/core';
import { useAtom, useAtomValue } from 'jotai';
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address, erc20Abi, formatUnits, parseEther, parseUnits } from 'viem';
import { type BaseError, useAccount, useReadContracts, useSendTransaction, useWalletClient } from 'wagmi';

import { Button, CircularProgress, Link, OutlinedInput, Typography } from '@mui/material';

import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { CurrencySelect } from 'components/currency-selector/CurrencySelect';
import { Dialog } from 'components/dialog/Dialog';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { modalSelectedCurrencyAtom, withdrawModalOpenAtom } from 'store/global-modals.store';
import { MethodE } from 'types/enums';
import { formatToCurrency } from 'utils/formatToCurrency';
import { isValidAddress } from 'utils/isValidAddress';

import { useTransferGasToken } from './hooks/useTransferGasToken';
import { useTransferTokens } from './hooks/useTransferTokens';

import { flatTokenAbi } from 'blockchain-api/abi/flatTokenAbi';
import styles from './WithdrawModal.module.scss';

export const WithdrawModal = () => {
  const { t } = useTranslation();

  const [amountValue, setAmountValue] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [loading, setLoading] = useState(false);

  const addressInputTouchedRef = useRef(false);

  const selectedCurrency = useAtomValue(modalSelectedCurrencyAtom);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useAtom(withdrawModalOpenAtom);

  const { gasTokenBalance, calculateGasForFee, refetchWallet } = useUserWallet();

  const { setTxHash: setTxHashForTokensTransfer } = useTransferTokens(amountValue, selectedCurrency?.settleToken);
  const { setTxHash: setTxHashForGasTransfer } = useTransferGasToken(
    amountValue,
    selectedCurrency?.name,
    refetchWallet
  );

  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();
  const { data: sendHash, error: sendError, isPending, sendTransaction } = useSendTransaction();

  useEffect(() => {
    setAmountValue('');
  }, [selectedCurrency]);

  useEffect(() => {
    setTxHashForGasTransfer(sendHash);
  }, [sendHash, setTxHashForGasTransfer]);

  useEffect(() => {
    if (sendError) {
      console.error(sendError);
      toast.error(<ToastContent title={(sendError as BaseError).shortMessage || sendError.message} bodyLines={[]} />);
    }
  }, [sendError]);

  useEffect(() => {
    setLoading(isPending);
    if (!isPending) {
      setAmountValue('');
    }
  }, [isPending]);

  const { data: selectedTokenBalanceData } = useReadContracts({
    allowFailure: true,
    contracts: [
      {
        address: selectedCurrency?.contractAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: selectedCurrency?.contractAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      },
      {
        address: selectedCurrency?.contractAddress,
        abi: flatTokenAbi,
        functionName: 'effectiveBalanceOf',
        args: [address as Address],
      },
    ],
    query: { enabled: address && !!selectedCurrency && isConnected },
  });

  const isAddressValid = useMemo(() => {
    if (addressValue.length > 42) {
      return false;
    }
    return isValidAddress(addressValue);
  }, [addressValue]);

  const handleValueChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!addressInputTouchedRef.current) {
      addressInputTouchedRef.current = true;
    }

    setAddressValue(event.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {}, []);

  const handleOnClose = () => setWithdrawModalOpen(false);

  const tokenBalance =
    selectedTokenBalanceData?.[2].status === 'success'
      ? selectedTokenBalanceData[2].result
      : selectedTokenBalanceData?.[0].result;

  const maxTokenValue = useMemo(() => {
    if (!selectedCurrency) {
      return undefined;
    }
    if (selectedCurrency.isGasToken) {
      const gasFee = calculateGasForFee(MethodE.Transfer, 1n);
      return gasTokenBalance && gasTokenBalance.value > gasFee
        ? +formatUnits(gasTokenBalance.value - gasFee, gasTokenBalance.decimals)
        : 0;
    }
    if (tokenBalance && selectedTokenBalanceData?.[1].status === 'success') {
      return +formatUnits(tokenBalance, selectedTokenBalanceData[1].result);
    }
    return 0;
  }, [selectedCurrency, tokenBalance, selectedTokenBalanceData, gasTokenBalance, calculateGasForFee]);

  const handleWithdraw = useCallback(() => {
    if (selectedCurrency && walletClient && isAddressValid && amountValue) {
      if (selectedCurrency.contractAddress && selectedTokenBalanceData?.[1].status === 'success') {
        setLoading(true);
        writeContract(wagmiConfig, {
          account: walletClient.account,
          abi: ERC20_ABI,
          address: selectedCurrency.contractAddress,
          functionName: 'transfer',
          args: [addressValue, parseUnits(amountValue, selectedTokenBalanceData[1].result)],
        })
          .then((tx) => {
            setTxHashForTokensTransfer(tx);
            setAmountValue('');
          })
          .catch((error) => {
            console.error(error);
            toast.error(<ToastContent title={error.shortMessage || error.message} bodyLines={[]} />);
          })
          .finally(() => {
            setLoading(false);
          });
      } else if (!selectedCurrency.contractAddress) {
        // Transfer GAS token without contractAddress
        sendTransaction({
          account: walletClient.account,
          to: addressValue as Address,
          value: parseEther(amountValue),
        });
      }
    }
  }, [
    selectedCurrency,
    selectedTokenBalanceData,
    walletClient,
    isAddressValid,
    addressValue,
    amountValue,
    setTxHashForTokensTransfer,
    sendTransaction,
  ]);

  return (
    <Dialog
      open={isWithdrawModalOpen}
      onClose={handleOnClose}
      onCloseClick={handleOnClose}
      className={styles.dialog}
      dialogTitle={t('common.withdraw-modal.title')}
      footerActions={
        <>
          <Button onClick={handleOnClose} variant="secondary">
            {t('common.info-modal.close')}
          </Button>
          <Button
            onClick={handleWithdraw}
            variant="primary"
            disabled={!address || !amountValue || +amountValue <= 0 || !isAddressValid || loading}
          >
            {loading && <CircularProgress size="24px" sx={{ mr: 2 }} />}
            {t('common.withdraw-modal.withdraw-button')}
          </Button>
        </>
      }
    >
      <div className={styles.section}>
        <CurrencySelect />
      </div>
      <Separator />
      <div className={styles.section}>
        <div className={styles.dataLine}>
          <div className={styles.label}>{t('common.amount-label')}</div>
          <ResponsiveInput
            id="withdraw-amount"
            className={styles.inputHolder}
            inputClassName={styles.input}
            inputValue={amountValue}
            setInputValue={setAmountValue}
            currency={selectedCurrency?.settleToken}
            min={0}
            max={maxTokenValue}
          />
          {maxTokenValue && maxTokenValue > 0 ? (
            <Typography className={styles.helperText} variant="bodyTiny">
              {t('common.max')}{' '}
              <Link
                onClick={() => {
                  if (maxTokenValue && maxTokenValue > 0) {
                    setAmountValue(`${maxTokenValue}`);
                  }
                }}
              >
                {formatToCurrency(maxTokenValue, selectedCurrency?.settleToken)}
              </Link>
            </Typography>
          ) : null}
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.dataLine}>
          <div className={styles.label}>{t('common.address-label')}</div>
          <div className={styles.inputHolder}>
            <OutlinedInput
              id="withdraw-address"
              type="text"
              className={styles.input}
              placeholder="0x..."
              onChange={handleValueChange}
              onBlur={handleInputBlur}
              value={addressValue}
            />
            {!isAddressValid && addressInputTouchedRef.current && (
              <Typography variant="bodySmall" color="red" component="p" mt={1}>
                {t('common.withdraw-modal.withdraw-address-error')}
              </Typography>
            )}
          </div>
        </div>
      </div>
      <Separator />
      <div className={styles.section}>
        <WalletBalances />
      </div>
    </Dialog>
  );
};

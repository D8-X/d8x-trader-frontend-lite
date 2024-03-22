import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAccount,
  useBalance,
  useEstimateGas,
  useGasPrice,
  useWaitForTransactionReceipt,
  useWalletClient,
} from 'wagmi';
import { type Address, formatUnits } from 'viem';

import { Button, Link, Typography } from '@mui/material';

import { transferFunds } from 'blockchain-api/transferFunds';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import styles from './FundingModal.module.scss';

interface FundingModalPropsI {
  isOpen: boolean;
  delegateAddress: Address;
  onClose: () => void;
}

export const FundingModal = ({ isOpen, onClose, delegateAddress }: FundingModalPropsI) => {
  const { t } = useTranslation();

  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();

  const [txHash, setTxHash] = useState<Address | undefined>(undefined);
  const [inputValue, setInputValue] = useState('');

  const { isFetched } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  const { data: gasTokenBalance } = useBalance({
    address,
    query: {
      enabled: address && isConnected,
    },
  });

  const { data: delegateBalance } = useBalance({
    address: delegateAddress,
  });

  useEffect(() => {
    if (isFetched) {
      setTxHash(undefined);
      onClose();
    }
  }, [isFetched, onClose]);

  const { data: estimatedGas } = useEstimateGas({
    account: walletClient?.account,
    chainId: walletClient?.chain.id,
    to: delegateAddress,
    value: 1n,
  });

  const { data: gasPrice } = useGasPrice({ chainId: walletClient?.chain.id });

  const roundedGasTokenBalance = useMemo(() => {
    if (gasTokenBalance && estimatedGas && gasPrice) {
      const parsedGasTokenBalance = parseFloat(formatUnits(gasTokenBalance.value, gasTokenBalance.decimals));
      const parsedGasFee = parseFloat(formatUnits((estimatedGas * gasPrice * 110n) / 100n, gasTokenBalance.decimals));
      const fractionDigitsGasTokenBalance = valueToFractionDigits(parsedGasTokenBalance);
      return (parsedGasTokenBalance - parsedGasFee).toFixed(fractionDigitsGasTokenBalance);
    }
    return '';
  }, [gasTokenBalance, estimatedGas, gasPrice]);

  const handleMaxGas = () => {
    if (gasTokenBalance) {
      setInputValue(roundedGasTokenBalance);
    } else {
      setInputValue('');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className={styles.dialogContent}>
        <div className={styles.dialogContent}>
          <Typography variant="h4" className={styles.title}>
            {t(`common.settings.one-click-modal.funding-modal.title`)}
          </Typography>
          <Typography variant="bodySmallPopup" className={styles.title}>
            {t(`common.settings.one-click-modal.funding-modal.description`)}
          </Typography>
          <div className={styles.inputWrapper}>
            <ResponsiveInput
              id="fund-amount"
              className={styles.inputHolder}
              inputClassName={styles.inputClassName}
              inputValue={inputValue}
              setInputValue={setInputValue}
              currency={delegateBalance?.symbol}
              min={0}
              max={+roundedGasTokenBalance}
            />
            {roundedGasTokenBalance && (
              <Typography className={styles.helperText} variant="bodyTiny">
                {t('common.max')} <Link onClick={handleMaxGas}>{roundedGasTokenBalance}</Link>
              </Typography>
            )}
          </div>
        </div>
        <div className={styles.buttonsBlock}>
          <Button variant="secondary" className={styles.cancelButton} onClick={onClose}>
            {t('pages.refer.trader-tab.cancel')}
          </Button>
          <GasDepositChecker>
            <Button
              variant="primary"
              className={styles.actionButton}
              onClick={async () => {
                if (!walletClient) {
                  return;
                }
                const transferTxHash = await transferFunds(
                  walletClient,
                  delegateAddress,
                  Number(inputValue),
                  estimatedGas,
                  gasPrice
                );
                setTxHash(transferTxHash.hash);
              }}
              disabled={!!txHash || !inputValue || +inputValue === 0}
            >
              {t(`common.settings.one-click-modal.funding-modal.fund`)}
            </Button>
          </GasDepositChecker>
        </div>
      </div>
    </Dialog>
  );
};

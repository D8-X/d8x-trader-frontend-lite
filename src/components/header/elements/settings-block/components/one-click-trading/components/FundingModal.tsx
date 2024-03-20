import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBalance, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { type Address, formatUnits } from 'viem';

import { Button, Link, Typography } from '@mui/material';

import { transferFunds } from 'blockchain-api/transferFunds';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import styles from './FundingModal.module.scss';
import { MethodE } from '../../../../../../../types/enums';

interface FundingModalPropsI {
  isOpen: boolean;
  delegateAddress: Address;
  onClose: () => void;
}

export const FundingModal = ({ isOpen, onClose, delegateAddress }: FundingModalPropsI) => {
  const { t } = useTranslation();

  const { data: walletClient } = useWalletClient();

  const { gasTokenBalance, calculateGasForFee } = useUserWallet();

  const [txHash, setTxHash] = useState<Address | undefined>(undefined);
  const [inputValue, setInputValue] = useState('');

  const { isFetched } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
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

  const estimatedGasFee = useMemo(() => {
    return calculateGasForFee(MethodE.Transfer, 1n);
  }, [calculateGasForFee]);

  const roundedGasTokenBalance = useMemo(() => {
    if (gasTokenBalance) {
      const parsedGasTokenBalance = parseFloat(formatUnits(gasTokenBalance.value, gasTokenBalance.decimals));
      const parsedGasFee = parseFloat(formatUnits(estimatedGasFee, gasTokenBalance.decimals));
      const fractionDigitsGasTokenBalance = valueToFractionDigits(parsedGasTokenBalance);
      return (parsedGasTokenBalance - parsedGasFee * 1.1).toFixed(fractionDigitsGasTokenBalance);
    }
    return '';
  }, [gasTokenBalance, estimatedGasFee]);

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
                const transferTxHash = await transferFunds(walletClient, delegateAddress, Number(inputValue));
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

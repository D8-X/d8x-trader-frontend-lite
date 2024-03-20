import { Box, Button, Link, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBalance, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { transferFunds } from 'blockchain-api/transferFunds';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { SidesRow } from 'components/sides-row/SidesRow';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import styles from './FundingModal.module.scss';

interface FundingModalPropsI {
  isOpen: boolean;
  delegateAddress: Address;
  mainAddress: Address;
  onClose: () => void;
}

export const FundingModal = ({ isOpen, onClose, delegateAddress, mainAddress }: FundingModalPropsI) => {
  const { t } = useTranslation();

  const { data: walletClient } = useWalletClient();
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);

  const { isFetched } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  useEffect(() => {
    if (isFetched) {
      setTxHash(undefined);
      onClose();
    }
  }, [isFetched, onClose]);

  const [inputValue, setInputValue] = useState('');

  const { data: delegateBalance } = useBalance({
    address: delegateAddress,
  });

  const { data: gasTokenBalance } = useBalance({
    address: mainAddress,
  });

  const handleMaxGas = () => {
    if (gasTokenBalance) {
      const value = parseFloat(formatUnits(gasTokenBalance.value, gasTokenBalance.decimals));
      const bufferValue = (value * 0.9).toString();
      setInputValue(bufferValue);
    } else {
      setInputValue('');
    }
  };

  const roundedGasTokenBalance = useMemo(() => {
    if (gasTokenBalance) {
      const formattedGasTokenBalance = formatUnits(gasTokenBalance.value, gasTokenBalance.decimals);
      const fractionDigitsGasTokenBalance = valueToFractionDigits(parseFloat(formattedGasTokenBalance));
      return (0.9 * parseFloat(formattedGasTokenBalance)).toFixed(fractionDigitsGasTokenBalance);
    }
    return '';
  }, [gasTokenBalance]);

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className={styles.dialogContent}>
        <Box className={styles.dialogContent}>
          <Typography variant="h4" className={styles.title}>
            {t(`common.settings.one-click-modal.funding-modal.title`)}
          </Typography>
          <Typography variant="bodySmallPopup" className={styles.title}>
            {t(`common.settings.one-click-modal.funding-modal.description`)}
          </Typography>
        </Box>
        <ResponsiveInput
          id="fund-amount"
          className={styles.inputHolder}
          inputValue={inputValue}
          setInputValue={setInputValue}
          currency={delegateBalance?.symbol}
          min={0}
          max={+roundedGasTokenBalance}
        />
        <SidesRow
          leftSide=" "
          rightSide={
            <Typography className={styles.helperText} variant="bodyTiny">
              {t('common.max')} <Link onClick={handleMaxGas}>{roundedGasTokenBalance}</Link>
            </Typography>
          }
        />
        <Box className={styles.buttonsBlock}>
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
        </Box>
      </div>
    </Dialog>
  );
};

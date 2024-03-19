import { Box, Button, Link, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBalance, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { type Address } from 'viem';

import { transferFunds } from 'blockchain-api/transferFunds';
import { Dialog } from 'components/dialog/Dialog';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { SidesRow } from 'components/sides-row/SidesRow';

import styles from './FundingModal.module.scss';

interface FundingModalPropsI {
  isOpen: boolean;
  delegateAddress: Address;
  mainAddress: Address;
  onClose: () => void;
}

export const FundingModal = ({ isOpen, onClose, delegateAddress, mainAddress }: FundingModalPropsI) => {
  console.log(mainAddress);
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
      setInputValue(gasTokenBalance.formatted);
    }
  };

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
        />
        <SidesRow
          leftSide=" "
          rightSide={
            <Typography className={styles.helperText} variant="bodyTiny">
              {t('common.max')} <Link onClick={handleMaxGas}>{gasTokenBalance?.formatted}</Link>
            </Typography>
          }
        />
        <Box className={styles.buttonsBlock}>
          <Button variant="secondary" className={styles.cancelButton} onClick={onClose}>
            {t('pages.refer.trader-tab.cancel')}
          </Button>
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
        </Box>
      </div>
    </Dialog>
  );
};

import { useAtom } from 'jotai';
import { type ChangeEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle, OutlinedInput } from '@mui/material';

import { CurrencySelect } from 'components/currency-selector/CurrencySelect';
import { CurrencyItemI } from 'components/currency-selector/types';
import { Dialog } from 'components/dialog/Dialog';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { Separator } from 'components/separator/Separator';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { withdrawModalOpenAtom } from 'store/global-modals.store';

import styles from './WithdrawModal.module.scss';
import { transferFunds } from 'blockchain-api/transferFunds';
import { Address, useWalletClient } from 'wagmi';
import { writeContract } from '@wagmi/core';
import { ERC20_ABI } from '@d8x/perpetuals-sdk';
import { parseUnits } from 'viem';

export const WithdrawModal = () => {
  const { t } = useTranslation();

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItemI>();
  const [amountValue, setAmountValue] = useState('');
  const [addressValue, setAddressValue] = useState('');

  const [isWithdrawModalOpen, setWithdrawModalOpen] = useAtom(withdrawModalOpenAtom);

  const { data: walletClient } = useWalletClient();

  const handleValueChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddressValue(event.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {}, []);

  const handleOnClose = () => setWithdrawModalOpen(false);

  const handleWithdraw = () => {
    if (selectedCurrency && walletClient) {
      if (selectedCurrency.contractAddress) {
        writeContract({
          account: walletClient.account,
          abi: ERC20_ABI,
          address: selectedCurrency.contractAddress as Address,
          functionName: 'transfer',
          args: [
            addressValue,
            parseUnits(amountValue, 6), // selectedCurrency.decimals), // <- need the currency decimals here
          ],
        }).then();
      } else {
        transferFunds(walletClient, addressValue as Address, +amountValue).then();
      }
    }
  };

  return (
    <Dialog open={isWithdrawModalOpen} onClose={handleOnClose} className={styles.dialog}>
      <DialogTitle>{t('common.withdraw-modal.title')}</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <Separator />
        <div className={styles.section}>
          <CurrencySelect selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency} />
        </div>
        <div className={styles.section}>
          <div className={styles.dataLine}>
            <div className={styles.label}>{t('common.amount-label')}</div>
            <ResponsiveInput
              id="withdraw-amount"
              className={styles.inputHolder}
              inputClassName={styles.input}
              inputValue={amountValue}
              setInputValue={setAmountValue}
              currency={selectedCurrency?.name}
              min={0}
            />
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles.dataLine}>
            <div className={styles.label}>{t('common.address-label')}</div>
            <OutlinedInput
              id="withdraw-address"
              type="text"
              className={styles.inputHolder}
              placeholder="0x..."
              onChange={handleValueChange}
              onBlur={handleInputBlur}
              value={addressValue}
            />
          </div>
        </div>
        <Separator />
        <div className={styles.section}>
          <WalletBalances />
        </div>
        <Separator />
      </DialogContent>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={handleOnClose} variant="secondary">
          {t('common.info-modal.close')}
        </Button>
        <Button onClick={handleWithdraw} variant="primary">
          {t('common.withdraw-modal.withdraw-button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

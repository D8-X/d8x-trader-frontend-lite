import { ERC20_ABI } from '@d8x/perpetuals-sdk';
import { writeContract } from '@wagmi/core';
import { useAtom } from 'jotai';
import { type ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseUnits } from 'viem';
import { Address, useAccount, useBalance, useWalletClient } from 'wagmi';

import { Button, DialogActions, DialogContent, DialogTitle, Link, OutlinedInput, Typography } from '@mui/material';

import { transferFunds } from 'blockchain-api/transferFunds';
import { CurrencySelect } from 'components/currency-selector/CurrencySelect';
import { CurrencyItemI } from 'components/currency-selector/types';
import { Dialog } from 'components/dialog/Dialog';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { Separator } from 'components/separator/Separator';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { withdrawModalOpenAtom } from 'store/global-modals.store';
import { isValidAddress } from 'utils/isValidAddress';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './WithdrawModal.module.scss';

export const WithdrawModal = () => {
  const { t } = useTranslation();

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItemI>();
  const [amountValue, setAmountValue] = useState('');
  const [addressValue, setAddressValue] = useState('');

  const addressInputTouchedRef = useRef(false);

  const [isWithdrawModalOpen, setWithdrawModalOpen] = useAtom(withdrawModalOpenAtom);

  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();

  const { data: selectedTokenBalanceData } = useBalance({
    address,
    token: selectedCurrency?.contractAddress,
    enabled: address && selectedCurrency && isConnected,
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

  const handleWithdraw = () => {
    if (selectedCurrency && selectedTokenBalanceData && walletClient && isAddressValid) {
      if (selectedCurrency.contractAddress) {
        writeContract({
          account: walletClient.account,
          abi: ERC20_ABI,
          address: selectedCurrency.contractAddress,
          functionName: 'transfer',
          args: [addressValue, parseUnits(amountValue, selectedTokenBalanceData.decimals)],
        }).then();
      } else {
        // Transfer GAS token without contractAddress
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
              max={
                selectedTokenBalanceData && selectedTokenBalanceData.value > 0
                  ? Number(selectedTokenBalanceData.formatted)
                  : undefined
              }
            />
            {selectedTokenBalanceData?.formatted && selectedTokenBalanceData.value > 0 ? (
              <Typography className={styles.helperText} variant="bodyTiny">
                {t('common.max')}{' '}
                <Link
                  onClick={() => {
                    if (selectedTokenBalanceData?.value > 0) {
                      setAmountValue(selectedTokenBalanceData.formatted);
                    }
                  }}
                >
                  {formatToCurrency(Number(selectedTokenBalanceData.formatted), selectedCurrency?.name)}
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
        <Separator />
      </DialogContent>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={handleOnClose} variant="secondary">
          {t('common.info-modal.close')}
        </Button>
        <Button
          onClick={handleWithdraw}
          variant="primary"
          disabled={!address || !amountValue || +amountValue <= 0 || !isAddressValid}
        >
          {t('common.withdraw-modal.withdraw-button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

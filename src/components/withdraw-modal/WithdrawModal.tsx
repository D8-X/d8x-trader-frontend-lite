import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { CurrencySelect } from 'components/currency-selector/CurrencySelect';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { withdrawModalOpenAtom } from 'store/global-modals.store';
import { PoolWithIdI } from 'types/types';

import styles from './WithdrawModal.module.scss';

export const WithdrawModal = () => {
  const { t } = useTranslation();

  const [selectedPool, setSelectedPool] = useState<PoolWithIdI>();

  const [isWithdrawModalOpen, setWithdrawModalOpen] = useAtom(withdrawModalOpenAtom);

  const handleOnClose = () => setWithdrawModalOpen(false);

  return (
    <Dialog open={isWithdrawModalOpen} onClose={handleOnClose} className={styles.dialog}>
      <DialogTitle>{t('common.withdraw-modal.title')}</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <Separator />
        <div className={styles.section}>
          <CurrencySelect selectedPool={selectedPool} setSelectedPool={setSelectedPool} />
        </div>
        <div className={styles.section}>Amount</div>
        <div className={styles.section}>Address</div>
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
        <Button variant="primary">{t('common.withdraw-modal.withdraw-button')}</Button>
      </DialogActions>
    </Dialog>
  );
};

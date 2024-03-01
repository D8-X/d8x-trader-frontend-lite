import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { CopyInput } from 'components/copy-input/CopyInput';
import { CopyLink } from 'components/copy-link/CopyLink';
import { CurrencySelect } from 'components/currency-selector/CurrencySelect';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { Translate } from 'components/translate/Translate';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { PoolWithIdI } from 'types/types';
import { cutAddress } from 'utils/cutAddress';

import styles from './DepositModal.module.scss';
import { useAccount, useNetwork } from 'wagmi';

interface DepositModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal = ({ isOpen, onClose }: DepositModalPropsI) => {
  const { t } = useTranslation();

  const [selectedPool, setSelectedPool] = useState<PoolWithIdI>();

  const { chain } = useNetwork();
  const { address } = useAccount();

  const poolAddress = selectedPool?.poolShareTokenAddr || '';

  return (
    <Dialog open={isOpen} onClose={onClose} className={styles.dialog}>
      <DialogTitle>{t('common.deposit-modal.title')}</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <Separator />
        <div className={styles.section}>
          <CurrencySelect selectedPool={selectedPool} setSelectedPool={setSelectedPool} />
        </div>
        <div className={styles.section}>
          <Typography variant="bodyTiny" className={styles.noteText}>
            <Translate
              i18nKey="common.deposit-modal.important-notice.1"
              values={{ currencyName: selectedPool?.poolSymbol }}
            />{' '}
            {t('common.deposit-modal.important-notice.2')}
            <CopyLink elementToShow={cutAddress(poolAddress)} textToCopy={poolAddress} classname={styles.copyText} />
            {t('common.deposit-modal.important-notice.3')} {t('common.deposit-modal.important-notice.4')}{' '}
            <Translate i18nKey="common.deposit-modal.important-notice.5" values={{ chainName: chain?.name }} />
          </Typography>
        </div>
        <div className={styles.section}>
          <CopyInput id="address" textToCopy={address || ''} />
        </div>
        <Separator />
        <div className={styles.section}>
          <WalletBalances />
        </div>
        <Separator />
      </DialogContent>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={onClose} variant="secondary" size="small">
          {t('common.deposit-modal.done-button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

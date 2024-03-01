import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { Web3AuthDisconnectButton } from 'components/web3auth-connect-button/Web3AuthDisconnectButton';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';

import styles from './AccountModal.module.scss';

interface AccountModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal = ({ isOpen, onClose }: AccountModalPropsI) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose} className={styles.dialog}>
      <DialogTitle>{t('common.account-modal.title')}</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        Buttons
        <Separator />
        <div className={styles.section}>
          <WalletBalances />
        </div>
        <Separator />
      </DialogContent>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={onClose} variant="secondary">
          {t('common.info-modal.close')}
        </Button>
        <Web3AuthDisconnectButton />
      </DialogActions>
    </Dialog>
  );
};

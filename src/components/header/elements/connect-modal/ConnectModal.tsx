import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { AccountBalanceWallet, CheckCircleOutline } from '@mui/icons-material';
import { Button, DialogTitle, Typography } from '@mui/material';

import { Web3AuthConnectButton } from 'components/web3auth-connect-button/Web3AuthConnectButton';
import { WalletConnectButton } from 'components/wallet-connect-button/WalletConnectButton';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';

import styles from './ConnectModal.module.scss';

interface ConnectModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal = ({ isOpen, onClose }: ConnectModalPropsI) => {
  const { t } = useTranslation();

  const { isConnected } = useAccount();

  return (
    <Dialog open={isOpen} onClose={onClose} className={styles.dialog}>
      {!isConnected && (
        <>
          <DialogTitle>{t('common.connect-modal.title')}</DialogTitle>
          <div className={classnames(styles.dialogContent, styles.centered)}>
            <Typography variant="bodyMedium">{t('common.connect-modal.description')}</Typography>
          </div>
          <Separator />
          <div className={styles.dialogContent}>
            <div className={styles.actionButtonsContainer}>
              <Web3AuthConnectButton buttonClassName={styles.connectButton} signInMethod="x" />
              <div className={styles.orSeparator}>
                <Separator />
                <div className={styles.orTextHolder}>
                  <span>{t('common.connect-modal.or-separator')}</span>
                </div>
              </div>
              <Web3AuthConnectButton buttonClassName={styles.connectButton} signInMethod="google" />
              <div className={styles.orSeparator}>
                <Separator />
                <div className={styles.orTextHolder}>
                  <span>{t('common.connect-modal.or-separator')}</span>
                </div>
              </div>
              <WalletConnectButton
                connectButtonLabel={
                  <>
                    <AccountBalanceWallet />
                    {t('common.connect-modal.sign-in-with-wallet-button')}
                  </>
                }
                buttonClassName={styles.connectButton}
              />
            </div>
          </div>
        </>
      )}
      {isConnected && (
        <>
          <DialogTitle>{t('common.connect-modal.connected-title')}</DialogTitle>
          <div className={classnames(styles.dialogContent, styles.centered)}>
            <CheckCircleOutline className={styles.successIcon} />
            <Typography variant="bodyMedium">{t('common.connect-modal.connected-description')}</Typography>
          </div>
        </>
      )}
      <Separator />
      <div className={styles.dialogContent}>
        <div className={styles.closeButtonContainer}>
          <Button variant="secondary" className={styles.cancelButton} onClick={onClose}>
            {t('common.info-modal.close')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

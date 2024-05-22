import classnames from 'classnames';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { AccountBalanceWallet, CheckCircleOutline } from '@mui/icons-material';
import { Button, DialogTitle, Typography } from '@mui/material';

import { Web3AuthConnectButton } from 'components/web3auth-connect-button/Web3AuthConnectButton';
import { WalletConnectButtonHolder } from 'components/wallet-connect-button/WalletConnectButtonHolder';
import { Dialog } from 'components/dialog/Dialog';
import { OrSeparator } from 'components/separator/OrSeparator';
import { Separator } from 'components/separator/Separator';
import { connectModalOpenAtom } from 'store/global-modals.store';
import { Web3SignInMethodE } from 'types/enums';

import styles from './ConnectModal.module.scss';

export const ConnectModal = () => {
  const { t } = useTranslation();

  const [isOpen, setOpen] = useAtom(connectModalOpenAtom);

  const { isConnected } = useAccount();

  const onClose = useCallback(() => setOpen(false), [setOpen]);

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
              <Web3AuthConnectButton buttonClassName={styles.connectButton} signInMethod={Web3SignInMethodE.X} />
              <Web3AuthConnectButton buttonClassName={styles.connectButton} signInMethod={Web3SignInMethodE.Google} />
              <OrSeparator />
              <WalletConnectButtonHolder
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

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { AccountBalanceWallet, CheckCircleOutline } from '@mui/icons-material';
import { Typography } from '@mui/material';

import { Web3AuthConnectButton } from 'components/web3auth-connect-button/Web3AuthConnectButton';
import { WalletConnectButtonHolder } from 'components/wallet-connect-button/WalletConnectButtonHolder';
import { Dialog } from 'components/dialog/Dialog';
import { SeparatorTypeE } from 'components/separator/enums';
import { OrSeparator } from 'components/separator/OrSeparator';
import { connectModalOpenAtom } from 'store/global-modals.store';
import { Web3SignInMethodE } from 'types/enums';

import styles from './ConnectModal.module.scss';

export const ConnectModal = () => {
  const { t } = useTranslation();

  const [isOpen, setOpen] = useAtom(connectModalOpenAtom);

  const { isConnected } = useAccount();
  const { connectModalOpen } = useConnectModal();

  const onClose = useCallback(() => setOpen(false), [setOpen]);

  return (
    <Dialog
      open={isOpen && !connectModalOpen}
      onClose={onClose}
      onCloseClick={onClose}
      className={styles.dialog}
      dialogTitle={t(!isConnected ? 'common.connect-modal.title' : 'common.connect-modal.connected-title')}
      dialogContentClassName={styles.centered}
    >
      {!isConnected && (
        <div>
          <Typography variant="bodyMedium" className={styles.description}>
            {t('common.connect-modal.description')}
          </Typography>
          <div className={styles.actionButtonsContainer}>
            <Web3AuthConnectButton buttonClassName={styles.connectButton} signInMethod={Web3SignInMethodE.X} />
            <Web3AuthConnectButton buttonClassName={styles.connectButton} signInMethod={Web3SignInMethodE.Google} />
            <OrSeparator separatorType={SeparatorTypeE.Modal} />
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
      )}
      {isConnected && (
        <div>
          <CheckCircleOutline className={styles.successIcon} />
          <Typography variant="bodyMedium">{t('common.connect-modal.connected-description')}</Typography>
        </div>
      )}
    </Dialog>
  );
};

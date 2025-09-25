import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { connectModalOpenAtom } from 'store/global-modals.store';

import { useLogout, usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import styles from './ConnectModal.module.scss';

export const ConnectModal = () => {
  const { t } = useTranslation();

  const [isOpen, setOpen] = useAtom(connectModalOpenAtom);

  const onClose = useCallback(() => setOpen(false), [setOpen]);

  const { ready, authenticated, isModalOpen, user } = usePrivy();

  // console.log('rendering connect modal', { ready, authenticated, isOpen });

  const { logout } = useLogout({
    onSuccess: () => {
      console.log('User successfully logged out');
      setOpen(false);
    },
  });

  const { setActiveWallet } = useSetActiveWallet();

  const { wallets } = useWallets();

  const embeddedWallet = wallets?.find((w) => w.connectorType === 'embedded');

  const setWalletRef = useRef(false);

  useEffect(() => {
    if (embeddedWallet && !setWalletRef.current) {
      setWalletRef.current = true;
      setActiveWallet(embeddedWallet)
        .then(() => {
          console.log('sucess, setActiveWallet:', { embeddedWallet });
        })
        .catch((e) => {
          console.log('error, setActiveWallet', { embeddedWallet, e });
        })
        .finally(() => {
          setWalletRef.current = false;
        });
    }
  }, [embeddedWallet, setActiveWallet]);

  return (
    <Dialog
      open={isOpen && !isModalOpen}
      onClose={onClose}
      onCloseClick={onClose}
      className={styles.dialog}
      dialogTitle={t(!authenticated ? 'common.connect-modal.title' : 'common.connect-modal.connected-title')}
      dialogContentClassName={styles.centered}
    >
      {ready && authenticated && (
        <div>
          <Typography variant="bodyMedium">{t('common.connect-modal.connected-description')}</Typography>
          <div className={styles.actionButtonsContainer}>
            <Typography variant="bodyTiny">
              User wallets: {user?.linkedAccounts?.map((acc) => acc.type)?.join(', ')}
            </Typography>
            <Typography variant="bodyTiny">Id {user?.id}</Typography>
            <Typography variant="bodyTiny">Created at {user?.createdAt?.toISOString()}</Typography>
            <Typography variant="bodyTiny">Accepted terms {user?.hasAcceptedTerms}</Typography>
            <Typography variant="bodyTiny">
              Wallet: {user?.wallet?.address}, {user?.wallet?.connectorType}, {user?.wallet?.walletClientType}
            </Typography>
            <Typography variant="bodyTiny">
              Smart wallet: {user?.smartWallet?.address}, {user?.smartWallet?.smartWalletType},{' '}
              {user?.smartWallet?.smartWalletVersion}
            </Typography>
            <Button onClick={logout}>Logout</Button>
            {/* <Web3AuthConnectButton buttonClassName={styles.connectButton} signInMethod={Web3SignInMethodE.X} />
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
            /> */}
          </div>
        </div>
      )}
    </Dialog>
  );
};

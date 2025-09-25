import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { connectModalOpenAtom } from 'store/global-modals.store';

import { useLogout, usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import styles from './ConnectModal.module.scss';

export const ConnectModal = () => {
  console.log('connect modal');
  const { t } = useTranslation();

  const [isOpen, setOpen] = useAtom(connectModalOpenAtom);

  const onClose = useCallback(() => setOpen(false), [setOpen]);

  const { ready, authenticated, isModalOpen, user } = usePrivy();

  console.log('rendering connect modal', { ready, authenticated, isOpen });

  const { logout } = useLogout({
    onSuccess: () => {
      console.log('User successfully logged out');
      setOpen(false);
    },
  });

  const { setActiveWallet } = useSetActiveWallet();

  const { wallets, ready: walletsReady } = useWallets();

  const setWalletRef = useRef(false);

  useEffect(() => {
    if (walletsReady) {
      const wallet = wallets.find((w) => w.connectorType === 'embedded');
      if (wallet && !wallet.linked && !setWalletRef.current) {
        setWalletRef.current = true;
        setActiveWallet(wallet)
          .then(() => {
            console.log('sucess, setActiveWallet:', { wallet });
          })
          .catch((e) => {
            console.log('error, setActiveWallet', { wallet, e });
          })
          .finally(() => {
            setWalletRef.current = false;
          });
      }
    }
  }, [wallets, walletsReady, setActiveWallet]);

  // TODO: add funds could go well here

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
          <div className={styles.actionButtonsContainer}>
            Connected with {user?.linkedAccounts?.map((acc) => acc.type)}
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
      {/* {authenticated && (
        <div>
          <CheckCircleOutline className={styles.successIcon} />
          <Typography variant="bodyMedium">{t('common.connect-modal.connected-description')}</Typography>
        </div>
      )} */}
    </Dialog>
  );
};

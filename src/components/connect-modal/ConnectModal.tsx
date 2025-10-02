import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { connectModalOpenAtom } from 'store/global-modals.store';

import { useLogout, usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { entryPoint06Address } from 'blockchain-api/account-abstraction';
import { pimlicoPaymaster, pimlicoRpcUrl } from 'blockchain-api/pimlico';
import { createSmartAccountClient } from 'permissionless';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { smartAccountClientAtom } from 'store/app.store';
import { berachain } from 'utils/chains';
import { http, useAccount, usePublicClient, useWalletClient } from 'wagmi';
import styles from './ConnectModal.module.scss';

export const ConnectModal = () => {
  const { t } = useTranslation();

  const [smartAccountClient, setSmartAccountClient] = useAtom(smartAccountClientAtom);

  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  // const [txHash, setTxHash] = useState<string | null>(null);
  // const { disconnect } = useDisconnect();

  const [isOpen, setOpen] = useAtom(connectModalOpenAtom);

  const onClose = useCallback(() => setOpen(false), [setOpen]);

  const { ready, authenticated, isModalOpen, user } = usePrivy();

  const { logout } = useLogout({
    onSuccess: () => {
      console.log('User successfully logged out');
      setOpen(false);
    },
  });

  const { setActiveWallet } = useSetActiveWallet();

  const { wallets } = useWallets();

  const embeddedWallet = useMemo(() => wallets.find((w) => w.walletClientType === 'privy'), [wallets]); // or w.connectorType === 'embedded' ?

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

  useEffect(() => {
    const initSmartAccount = async () => {
      if (!isConnected || !walletClient || !publicClient) {
        return;
      }

      try {
        if ([42161, 747474].includes(walletClient.chain.id)) {
          const safeSmartAccountClient = await toSimpleSmartAccount({
            client: publicClient,
            owner: walletClient,
            entryPoint: {
              address: entryPoint06Address,
              version: '0.6',
            },
          });

          const c = createSmartAccountClient({
            account: safeSmartAccountClient,
            chain: berachain,
            bundlerTransport: http(pimlicoRpcUrl),
            paymaster: pimlicoPaymaster,
            userOperation: {
              estimateFeesPerGas: async () => (await pimlicoPaymaster.getUserOperationGasPrice()).fast,
            },
          });

          setSmartAccountClient(c);
        } else {
          setSmartAccountClient(walletClient);
        }
      } catch (error) {
        console.error('Failed to initialize smart account:', error);
      }
    };

    initSmartAccount();
  }, [isConnected, walletClient, publicClient, setSmartAccountClient]);

  // TODO: what to show here?

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
              User acounts: {user?.linkedAccounts?.map((acc) => acc.type)?.join(', ')}
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
            <Typography> Smart Account: {smartAccountClient?.account?.address} </Typography>
            {smartAccountClient?.account?.address && (
              <a
                href={`${berachain.blockExplorers.default.url}/address/${smartAccountClient?.account?.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View in Explorer
              </a>
            )}
            <div>
              {/* <Button onClick={() => disconnect()}>Disconnect</Button> */}
              <Button onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

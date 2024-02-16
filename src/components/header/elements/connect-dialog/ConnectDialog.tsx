import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Box, Button, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { walletClientAtom } from 'store/app.store';

import styles from './ConnectDialog.module.scss';
import { Web3AuthConnectButton } from 'components/web3auth-connect-button/Web3AuthConnectButton';
import { WalletConnectButton } from 'components/wallet-connect-button/WalletConnectButton';

interface ConnectDialogPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectDialog = ({ isOpen, onClose }: ConnectDialogPropsI) => {
  const { t } = useTranslation();
  const walletClient = useAtomValue(walletClientAtom);

  return (
    <>
      <Dialog open={isOpen} onClose={onClose}>
        <Box className={styles.dialogContent}>
          <Typography variant="h4" className={styles.title}>
            {'Connect placeholder title'}
          </Typography>
          <Typography variant="bodyMedium">{'Placeholder connect options description'}</Typography>
        </Box>
        <Separator />
        <Box className={styles.dialogContent}>
          {
            <>
              {
                <div>
                  {walletClient?.account?.address && (
                    <div className={styles.infoLine}>
                      <div className={styles.infoTitle}>{'Address'}</div>
                      <div className={styles.address}>{walletClient?.account?.address}</div>
                    </div>
                  )}
                </div>
              }
            </>
          }
        </Box>
        <Box className={styles.dialogContent}>
          <Box className={styles.actionButtonsContainer}>
            <>
              <Web3AuthConnectButton />
              <WalletConnectButton />
            </>
          </Box>
        </Box>
        <Separator />
        <Box className={styles.dialogContent}>
          <Box className={styles.closeButtonsContainer}>
            <Button variant="secondary" className={styles.cancelButton} onClick={onClose}>
              {t('common.info-modal.close')}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

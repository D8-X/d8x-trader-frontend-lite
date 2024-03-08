import { getPublicKey } from '@noble/secp256k1';
import classnames from 'classnames';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useCallback, useRef } from 'react';
import { bytesToHex } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import { AccountBalanceWallet, CheckCircleOutline } from '@mui/icons-material';
import { Button, DialogTitle, Typography } from '@mui/material';

import { Web3AuthConnectButton } from 'components/web3auth-connect-button/Web3AuthConnectButton';
import { WalletConnectButton } from 'components/wallet-connect-button/WalletConnectButton';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { postSocialVerify } from 'network/referral';
import { socialPKAtom, socialUserInfoAtom } from 'store/web3-auth.store';

import styles from './ConnectModal.module.scss';

interface ConnectModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal = ({ isOpen, onClose }: ConnectModalPropsI) => {
  const { t } = useTranslation();

  const { isConnected } = useAccount();

  const userInfo = useAtomValue(socialUserInfoAtom);
  const socialPK = useAtomValue(socialPKAtom);

  const verifyRef = useRef(false);

  const chainId = useChainId();

  const handleWeb3AuthSuccessConnect = useCallback(() => {
    const verify = async () => {
      if (!chainId || !userInfo?.idToken || verifyRef.current || !socialPK) {
        return;
      }
      try {
        verifyRef.current = true;
        const pubKey = bytesToHex(getPublicKey(socialPK));
        await postSocialVerify(chainId, userInfo.idToken, pubKey).catch((e) =>
          console.log('POST /social-verify error', e)
        );
      } catch (error) {
        console.log(error);
      } finally {
        verifyRef.current = false;
      }
    };
    verify().then();
  }, [chainId, socialPK, userInfo]);

  const handleWeb3AuthErrorConnect = useCallback((error: string) => {
    console.log(error);
  }, []);

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
              <Web3AuthConnectButton
                buttonClassName={styles.connectButton}
                successCallback={handleWeb3AuthSuccessConnect}
                errorCallback={handleWeb3AuthErrorConnect}
              />
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

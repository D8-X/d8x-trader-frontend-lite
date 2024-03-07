import { PerpetualDataHandler, TraderInterface } from '@d8x/perpetuals-sdk';
import classnames from 'classnames';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef } from 'react';
import { type PublicClient, useAccount, useChainId, usePublicClient } from 'wagmi';

import { AccountBalanceWallet, CheckCircleOutline } from '@mui/icons-material';
import { Button, DialogTitle, Typography } from '@mui/material';

import { Web3AuthConnectButton } from 'components/web3auth-connect-button/Web3AuthConnectButton';
import { WalletConnectButton } from 'components/wallet-connect-button/WalletConnectButton';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { config } from 'config';
import { traderAPIAtom, traderAPIBusyAtom } from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';

import styles from './ConnectModal.module.scss';
import { socialPKAtom, socialUserInfoAtom } from 'store/web3-auth.store';
import { getPublicKey } from '@noble/secp256k1';
import { bytesToHex } from 'viem';
import { postSocialVerify } from 'network/referral';

interface ConnectModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal = ({ isOpen, onClose }: ConnectModalPropsI) => {
  const { t } = useTranslation();

  const { isConnected } = useAccount();

  const userInfo = useAtomValue(socialUserInfoAtom);
  const socialPK = useAtomValue(socialPKAtom);

  const setTraderAPI = useSetAtom(traderAPIAtom);
  const setSDKConnected = useSetAtom(sdkConnectedAtom);
  const setAPIBusy = useSetAtom(traderAPIBusyAtom);

  const loadingAPIRef = useRef(false);
  const verifyRef = useRef(false);

  const chainId = useChainId();

  const publicClient = usePublicClient();

  const loadSDK = useCallback(
    async (_publicClient: PublicClient, _chainId: number) => {
      if (loadingAPIRef.current) {
        return;
      }
      loadingAPIRef.current = true;
      setTraderAPI(null);
      setSDKConnected(false);
      setAPIBusy(true);
      const configSDK = PerpetualDataHandler.readSDKConfig(_chainId);
      if (config.priceFeedEndpoint[_chainId] && config.priceFeedEndpoint[_chainId] !== '') {
        const pythPriceServiceIdx = configSDK.priceFeedEndpoints?.findIndex(({ type }) => type === 'pyth');
        if (pythPriceServiceIdx !== undefined && pythPriceServiceIdx >= 0) {
          if (configSDK.priceFeedEndpoints !== undefined) {
            configSDK.priceFeedEndpoints[pythPriceServiceIdx].endpoints.push(config.priceFeedEndpoint[_chainId]);
          }
        } else {
          configSDK.priceFeedEndpoints = [{ type: 'pyth', endpoints: [config.priceFeedEndpoint[_chainId]] }];
        }
      }
      const newTraderAPI = new TraderInterface(configSDK);
      newTraderAPI
        .createProxyInstance()
        .then(() => {
          loadingAPIRef.current = false;
          setAPIBusy(false);
          setSDKConnected(true);
          setTraderAPI(newTraderAPI);
        })
        .catch((e) => {
          console.log('error loading SDK', e);
          loadingAPIRef.current = false;
          setAPIBusy(false);
        });
    },
    [setTraderAPI, setSDKConnected, setAPIBusy]
  );

  const unloadSDK = useCallback(() => {
    setSDKConnected(false);
    setAPIBusy(false);
    setTraderAPI(null);
  }, [setTraderAPI, setSDKConnected, setAPIBusy]);

  // disconnect SDK on wallet disconnected
  useEffect(() => {
    if (!isConnected) {
      unloadSDK();
    }
  }, [isConnected, unloadSDK]);

  // connect SDK on change of provider/chain/wallet
  useEffect(() => {
    if (loadingAPIRef.current || !publicClient || !chainId) {
      return;
    }
    unloadSDK();
    loadSDK(publicClient, chainId)
      .then()
      .catch((err) => console.log(err));
  }, [publicClient, chainId, loadSDK, unloadSDK]);

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

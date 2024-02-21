import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Box, Button, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { socialUserInfoAtom } from 'store/app.store';

import styles from './ConnectModal.module.scss';
import { Web3AuthConnectButton } from 'components/web3auth-connect-button/Web3AuthConnectButton';
import { WalletConnectButton } from 'components/wallet-connect-button/WalletConnectButton';
import { traderAPIAtom, traderAPIBusyAtom } from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { useCallback, useEffect, useRef } from 'react';
import { PublicClient, useAccount, useChainId, usePublicClient } from 'wagmi';
import { PerpetualDataHandler, TraderInterface } from '@d8x/perpetuals-sdk';
import { config } from 'config';
import { useChainModal } from '@rainbow-me/rainbowkit';

interface ConnectModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal = ({ isOpen, onClose }: ConnectModalPropsI) => {
  const { t } = useTranslation();

  const { address, isConnected } = useAccount();

  const userInfo = useAtomValue(socialUserInfoAtom);

  const setTraderAPI = useSetAtom(traderAPIAtom);
  const setSDKConnected = useSetAtom(sdkConnectedAtom);
  const setAPIBusy = useSetAtom(traderAPIBusyAtom);

  const { openChainModal } = useChainModal();

  const loadingAPIRef = useRef(false);

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
      // console.log(`loading SDK on chainId ${_chainId}`);
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
                  {address && (
                    <div className={styles.infoLine}>
                      <div className={styles.infoTitle}>{'Address'}</div>
                      <div className={styles.address}>{address}</div>
                    </div>
                  )}
                </div>
              }
              {
                <div>
                  {userInfo &&
                    Object.entries(userInfo).map(([k, v]) => (
                      <div className={styles.infoLine} key={k}>
                        <div className={styles.infoTitle}>{k}</div>
                        <div className={styles.address}> {v} </div>
                      </div>
                    ))}
                </div>
              }
              <Button onClick={openChainModal} className={styles.chainButton} variant="primary">
                Select Chain
              </Button>
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

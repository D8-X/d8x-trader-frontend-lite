import { PerpetualDataHandler, TraderInterface } from '@d8x/perpetuals-sdk';
import { Provider } from '@ethersproject/abstract-provider';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useConnect, useSigner } from 'wagmi';

import { Box, Button, useMediaQuery, useTheme } from '@mui/material';

import { ReactComponent as FilledStar } from 'assets/starFilled.svg';
import { ReactComponent as EmptyStar } from 'assets/starEmpty.svg';
import { ReactComponent as WalletIcon } from 'assets/icons/walletIcon.svg';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTraderLoyalty } from 'network/network';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { loyaltyScoreAtom, traderAPIAtom, traderAPIBusyAtom } from 'store/pools.store';
import { cutAddressName } from 'utils/cutAddressName';

import styles from './WalletConnectButton.module.scss';

const loyaltyMap: Record<number, string> = {
  1: 'Diamond',
  2: 'Platinum',
  3: 'Gold',
  4: 'Silver',
  5: '-',
};

export const WalletConnectButton = memo(() => {
  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [, setTraderAPI] = useAtom(traderAPIAtom);
  const [loyaltyScore, setLoyaltyScore] = useAtom(loyaltyScoreAtom);
  const [, setSDKConnected] = useAtom(sdkConnectedAtom);
  const [, setAPIBusy] = useAtom(traderAPIBusyAtom);

  const loadingAPIRef = useRef(false);
  const loadingTraderLoyaltyRef = useRef(false);

  // const { address } = useAccount();
  const chainId = useChainId();
  // const provider = useProvider();
  const { data: signer } = useSigner();
  const { address, isConnected, isReconnecting, isDisconnected } = useAccount();
  const { error: errorMessage } = useConnect();

  const loadSDK = useCallback(
    async (_provider: Provider, _chainId: number) => {
      if (loadingAPIRef.current) {
        return;
      }
      loadingAPIRef.current = true;
      setTraderAPI(null);
      setSDKConnected(false);
      setAPIBusy(true);
      console.log(`loading SDK on chainId ${_chainId}`);
      const newTraderAPI = new TraderInterface(PerpetualDataHandler.readSDKConfig(_chainId));
      await newTraderAPI
        .createProxyInstance(_provider)
        .then(() => {
          loadingAPIRef.current = false;
          setAPIBusy(false);
          setSDKConnected(true);
          console.log(`SDK loaded on chain id ${_chainId}`);
        })
        .catch((err) => {
          console.log(`error loading SDK `);
          loadingAPIRef.current = false;
          setAPIBusy(false);
          console.error(err);
          if (err?.code) {
            console.log('error code', err.code);
          }
        });
      setTraderAPI(newTraderAPI);
    },
    [setTraderAPI, setSDKConnected, setAPIBusy]
  );

  const unloadSDK = useCallback(() => {
    setSDKConnected(false);
    setAPIBusy(false);
    setTraderAPI(null);
  }, [setTraderAPI, setSDKConnected, setAPIBusy]);

  useEffect(() => {
    if (loadingTraderLoyaltyRef.current) {
      return;
    }

    if (address) {
      loadingTraderLoyaltyRef.current = true;
      getTraderLoyalty(chainId, address)
        .then((data) => {
          setLoyaltyScore(data.data);
        })
        .finally(() => {
          loadingTraderLoyaltyRef.current = false;
        });
    } else {
      setLoyaltyScore(5);
    }
  }, [chainId, address, setLoyaltyScore]);

  // disconnect SDK on error
  useEffect(() => {
    if (errorMessage) {
      toast.error(
        <ToastContent title="Connection error" bodyLines={[{ label: 'Reason', value: errorMessage.message }]} />
      );
      unloadSDK();
    }
  }, [errorMessage, unloadSDK]);

  // disconnect SDK on wallet disconnected
  useEffect(() => {
    if (isDisconnected || isReconnecting) {
      unloadSDK();
    }
  }, [isDisconnected, isReconnecting, unloadSDK]);

  // connect SDK on change of provider/chain/wallet
  useEffect(() => {
    if (loadingAPIRef.current || !isConnected || !signer?.provider || !chainId) {
      return;
    }
    unloadSDK();
    loadSDK(signer.provider, chainId)
      .then(() => {})
      .catch((err) => console.log(err));
  }, [isConnected, signer, chainId, loadSDK, unloadSDK]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              className: styles.root,
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} variant="primary" className={styles.connectWalletButton}>
                    Connect
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="warning">
                    Wrong network
                  </Button>
                );
              }

              return (
                <div className={styles.buttonsHolder}>
                  <Button onClick={openChainModal} className={styles.chainButton} variant="primary">
                    <img src={chain.iconUrl} alt={chain.name} title={chain.name} />
                  </Button>
                  <Button onClick={openAccountModal} variant="primary" className={styles.addressButton}>
                    {!isMobileScreen && (
                      <Box className={styles.starsHolder} title={loyaltyMap[loyaltyScore]}>
                        {loyaltyScore < 5 ? <FilledStar /> : <EmptyStar />}
                        {loyaltyScore < 4 ? <FilledStar /> : <EmptyStar />}
                        {loyaltyScore < 3 ? <FilledStar /> : <EmptyStar />}
                        {loyaltyScore < 2 ? <FilledStar /> : <EmptyStar />}
                      </Box>
                    )}
                    {!isMobileScreen && cutAddressName(account.address)}
                    {isMobileScreen && <WalletIcon />}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
});

import { LiquidityProviderTool, PerpetualDataHandler, TraderInterface } from '@d8x/perpetuals-sdk';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider } from '@ethersproject/abstract-provider';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useConnect, useProvider, useSigner } from 'wagmi';

import { Box, Button } from '@mui/material';

import { ReactComponent as FilledStar } from 'assets/starFilled.svg';
import { ReactComponent as EmptyStar } from 'assets/starEmpty.svg';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTraderLoyalty } from 'network/network';
import { liqProvToolAtom, sdkConnectedAtom } from 'store/vault-pools.store';
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
  const [traderAPI, setTraderAPI] = useAtom(traderAPIAtom);
  const [liqProvTool, setLiqProvTool] = useAtom(liqProvToolAtom);
  const [loyaltyScore, setLoyaltyScore] = useAtom(loyaltyScoreAtom);
  const [, setSDKConnected] = useAtom(sdkConnectedAtom);
  const [, setAPIBusy] = useAtom(traderAPIBusyAtom);

  const { data: signer } = useSigner({
    onError(error) {
      console.log(error);
    },
  });

  const traderAPIRef = useRef(traderAPI);
  const loadingAPIRef = useRef(false);
  const liqProvToolRef = useRef(liqProvTool);
  // const loadingLiqProvToolRef = useRef(false);

  const { address } = useAccount();
  const chainId = useChainId();
  const provider = useProvider();
  const { isConnected, isReconnecting, isDisconnected } = useAccount();
  const { error: errorMessage } = useConnect();

  const loadSDK = useCallback(
    async (_signer: Signer, _provider: Provider, _chainId: number) => {
      if (loadingAPIRef.current) {
        return;
      }
      loadingAPIRef.current = true;
      setTraderAPI(null);
      setLiqProvTool(null);
      setSDKConnected(false);
      console.log(`loading SDK on chainId ${_chainId}`);
      const newTraderAPI = new TraderInterface(PerpetualDataHandler.readSDKConfig(_chainId));
      const newLiqProvTool = new LiquidityProviderTool(PerpetualDataHandler.readSDKConfig(_chainId), _signer);
      await Promise.all([newTraderAPI.createProxyInstance(_provider), newLiqProvTool.createProxyInstance(_provider)]);
      setTraderAPI(newTraderAPI);
      setLiqProvTool(newLiqProvTool);
      loadingAPIRef.current = false;
      setSDKConnected(true);
      setAPIBusy(false);
      console.log(`SDK loaded on chain id ${_chainId}`);
    },
    [setTraderAPI, setLiqProvTool, setSDKConnected, setAPIBusy]
  );

  const unloadSDK = useCallback(() => {
    if (traderAPIRef.current) {
      setTraderAPI(null);
    }
    if (liqProvToolRef.current) {
      setLiqProvTool(null);
    }
    setSDKConnected(false);
    setAPIBusy(false);
  }, [setTraderAPI, setLiqProvTool, setSDKConnected, setAPIBusy]);

  useEffect(() => {
    if (address) {
      getTraderLoyalty(chainId, address).then((data) => {
        setLoyaltyScore(data.data);
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
    if (isDisconnected || isReconnecting || traderAPIRef.current) {
      unloadSDK();
    }
  }, [isDisconnected, isReconnecting, unloadSDK]);

  // connect SDK on change of provider/chain/wallet
  useEffect(() => {
    if (loadingAPIRef.current || !isConnected || !provider || !signer || !chainId) {
      return;
    }
    loadSDK(signer, provider, chainId)
      .then(() => {})
      .catch((err) => console.log(err));
  }, [isConnected, provider, signer, chainId, loadSDK]);

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
                    Connect wallet
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
                    <Box className={styles.starsHolder} title={loyaltyMap[loyaltyScore]}>
                      {loyaltyScore < 5 ? <FilledStar /> : <EmptyStar />}
                      {loyaltyScore < 4 ? <FilledStar /> : <EmptyStar />}
                      {loyaltyScore < 3 ? <FilledStar /> : <EmptyStar />}
                      {loyaltyScore < 2 ? <FilledStar /> : <EmptyStar />}
                    </Box>
                    {cutAddressName(account.address)}
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

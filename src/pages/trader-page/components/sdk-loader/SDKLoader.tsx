import { PerpetualDataHandler, TraderInterface } from '@d8x/perpetuals-sdk';
import { memo, useCallback, useEffect, useRef } from 'react';
import { PublicClient, useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';

import { useAtomValue, useSetAtom } from 'jotai';

import { traderAPIAtom, traderAPIBusyAtom } from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { config } from 'config';
import { activatedOneClickTradingAtom, tradingClientAtom } from 'store/app.store';
import { web3authAtom } from 'store/web3-auth.store';
// import { hexToNumber, numberToHex } from 'viem';
// import { ADAPTER_STATUS } from '@web3auth/base';

export const SDKLoader = memo(() => {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const publicClient = usePublicClient();
  const { data: walletClient, isSuccess, refetch } = useWalletClient();

  const activatedOneClickTrading = useAtomValue(activatedOneClickTradingAtom);
  const web3auth = useAtomValue(web3authAtom);

  const setTraderAPI = useSetAtom(traderAPIAtom);
  const setSDKConnected = useSetAtom(sdkConnectedAtom);
  const setAPIBusy = useSetAtom(traderAPIBusyAtom);
  const setTradingClient = useSetAtom(tradingClientAtom);

  const loadingAPIRef = useRef(false);

  useEffect(() => {
    console.log('publicClient chain id', publicClient.chain.id);
    console.log('web3auth', web3auth?.status, web3auth?.connected);
    console.log('walletClient', walletClient?.chain.id, isSuccess);
    console.log(web3auth);
    // if (web3auth?.status === ADAPTER_STATUS.READY) {
    //   console.log(
    //     'web3auth.switchChain, from-to:',
    //     hexToNumber((web3auth.provider?.chainId as `0x${string}`) ?? '0x0'),
    //     publicClient.chain.id,
    //     web3auth.status,
    //     web3auth.connected
    //   );
    //   refetch();
    //   web3auth.switchChain({ chainId: numberToHex(publicClient.chain.id) });
    // }
    // if (!!web3auth && web3auth.status === ADAPTER_STATUS.NOT_READY) {
    //   web3auth.init();
    // }
  }, [web3auth, publicClient, walletClient, isSuccess, refetch]);

  useEffect(() => {
    console.log('SDKLoader::setTradingClient', walletClient?.account, walletClient?.chain.id, isSuccess);
    if (walletClient && isSuccess && !activatedOneClickTrading) {
      setTradingClient(walletClient);
      return;
    }
  }, [isSuccess, walletClient, activatedOneClickTrading, setTradingClient]);

  const loadSDK = useCallback(
    async (_publicClient: PublicClient, _chainId: number) => {
      if (loadingAPIRef.current) {
        console.log('not loading sdk because ref');
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
  }, [isConnected, publicClient, chainId, loadSDK, unloadSDK]);

  return null;
});

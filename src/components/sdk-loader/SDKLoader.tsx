import { PerpetualDataHandler, TraderInterface } from '@d8x/perpetuals-sdk';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef } from 'react';
import { type Client } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { config } from 'config';
import { traderAPIAtom, traderAPIBusyAtom } from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { activatedOneClickTradingAtom, tradingClientAtom } from 'store/app.store';
import { isEnabledChain } from 'utils/isEnabledChain';

export const SDKLoader = memo(() => {
  const { isConnected, chainId } = useAccount();

  const publicClient = usePublicClient();
  const { data: walletClient, isSuccess } = useWalletClient();

  const activatedOneClickTrading = useAtomValue(activatedOneClickTradingAtom);

  const setTraderAPI = useSetAtom(traderAPIAtom);
  const setSDKConnected = useSetAtom(sdkConnectedAtom);
  const setAPIBusy = useSetAtom(traderAPIBusyAtom);
  const setTradingClient = useSetAtom(tradingClientAtom);

  const loadingAPIRef = useRef(false);

  useEffect(() => {
    if (walletClient && isSuccess && !activatedOneClickTrading) {
      setTradingClient(walletClient);
      return;
    }
  }, [isSuccess, walletClient, activatedOneClickTrading, setTradingClient]);

  const loadSDK = useCallback(
    async (_publicClient: Client, _chainId: number) => {
      setTraderAPI(null);
      setSDKConnected(false);

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

      if (config.httpRPC[_chainId] && config.httpRPC[_chainId] !== '') {
        configSDK.nodeURL = config.httpRPC[_chainId];
      }

      const newTraderAPI = new TraderInterface(configSDK);
      return newTraderAPI
        .createProxyInstance()
        .then(() => {
          setSDKConnected(true);
          setTraderAPI(newTraderAPI);
        })
        .catch((e) => {
          console.log('error loading SDK', e);
        });
    },
    [setTraderAPI, setSDKConnected]
  );

  const unloadSDK = useCallback(() => {
    setSDKConnected(false);
    setAPIBusy(false);
    setTraderAPI(null);
  }, [setTraderAPI, setSDKConnected, setAPIBusy]);

  // connect SDK on change of provider/chain/wallet
  useEffect(() => {
    if (loadingAPIRef.current || !publicClient) {
      return;
    }
    unloadSDK();

    setAPIBusy(true);
    loadingAPIRef.current = true;

    let chainIdForSDK: number;
    if (!isEnabledChain(chainId)) {
      chainIdForSDK = config.enabledChains[0];
    } else {
      chainIdForSDK = chainId;
    }

    loadSDK(publicClient, chainIdForSDK)
      .then()
      .catch(console.error)
      .finally(() => {
        loadingAPIRef.current = false;
        setAPIBusy(false);
      });
  }, [isConnected, publicClient, chainId, loadSDK, unloadSDK, setAPIBusy]);

  return null;
});

import { PerpetualDataHandler, TraderInterface } from '@d8x/perpetuals-sdk';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef } from 'react';
import { type Client } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { config } from 'config';
import { collateralToSettleConversionAtom, poolsAtom, traderAPIAtom, traderAPIBusyAtom } from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { activatedOneClickTradingAtom, tradingClientAtom } from 'store/app.store';
import { isEnabledChain } from 'utils/isEnabledChain';
import { useLocation } from 'react-router-dom';

export const SDKLoader = memo(() => {
  const { isConnected, chainId } = useAccount();

  const publicClient = usePublicClient();
  const { data: walletClient, isSuccess } = useWalletClient();

  const [traderAPI, setTraderAPI] = useAtom(traderAPIAtom);

  const activatedOneClickTrading = useAtomValue(activatedOneClickTradingAtom);
  const pools = useAtomValue(poolsAtom);

  const setSDKConnected = useSetAtom(sdkConnectedAtom);
  const setAPIBusy = useSetAtom(traderAPIBusyAtom);
  const setTradingClient = useSetAtom(tradingClientAtom);
  const setCollToSettleConversion = useSetAtom(collateralToSettleConversionAtom);

  const loadingAPIRef = useRef(false);
  const location = useLocation();

  const chainIdFromUrl = parseInt(location.hash.split('__')[1]?.split('=')[1], 10);

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
          console.error('error loading SDK', e);
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
    if (!isNaN(chainIdFromUrl) && isEnabledChain(chainIdFromUrl) && chainId === undefined) {
      chainIdForSDK = chainIdFromUrl;
    } else if (isEnabledChain(chainId)) {
      chainIdForSDK = chainId;
    } else {
      chainIdForSDK = config.enabledChains[0];
    }

    loadSDK(publicClient, chainIdForSDK)
      .then()
      .catch(console.error)
      .finally(() => {
        loadingAPIRef.current = false;
        setAPIBusy(false);
      });

    return () => {
      loadingAPIRef.current = false;
    };
  }, [isConnected, publicClient, chainId, loadSDK, unloadSDK, setAPIBusy, chainIdFromUrl]);

  useEffect(() => {
    if (isConnected && traderAPI && pools.length > 0) {
      for (const pool of pools) {
        if (pool.marginTokenAddr != pool.settleTokenAddr) {
          traderAPI
            .fetchCollateralToSettlementConversion(pool.poolSymbol)
            .then((px) =>
              setCollToSettleConversion({
                poolSymbol: pool.poolSymbol,
                settleSymbol: pool.settleSymbol,
                value: px,
              })
            )
            .catch((error) => {
              console.error(error);
            });
        } else {
          setCollToSettleConversion({
            poolSymbol: pool.poolSymbol,
            settleSymbol: pool.poolSymbol,
            value: 1,
          });
        }
      }
    }
  }, [pools, isConnected, traderAPI, setCollToSettleConversion]);

  return null;
});

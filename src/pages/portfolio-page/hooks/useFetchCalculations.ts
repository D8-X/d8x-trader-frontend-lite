import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

import { poolsAtom, traderAPIAtom } from 'store/pools.store';
import { isEnabledChain } from 'utils/isEnabledChain';

import { fetchUnrealizedPnLAtom } from '../store/fetchUnrealizedPnL';
import { fetchRealizedPnLAtom } from '../store/fetchRealizedPnL';
import { fetchEarningsAtom } from '../store/fetchEarnings';
import { fetchPoolShareAtom } from '../store/fetchPoolShare';
import { fetchPoolTokensUSDBalanceAtom } from '../store/fetchPoolTokensUSDBalance';
import { fetchStrategySyntheticPositionAtom } from '../store/fetchStrategySyntheticPosition';
import { poolUsdPriceAtom, poolUsdPriceMapAtom } from '../store/fetchTotalReferralsRewards';
import { useFetchOpenRewards } from '../../refer-page/components/trader-tab/useFetchOpenRewards';

export const useFetchCalculations = () => {
  const { address, chainId } = useAccount();

  const { openRewards } = useFetchOpenRewards();

  const pools = useAtomValue(poolsAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const poolUsdPrice = useAtomValue(poolUsdPriceAtom);
  const fetchUnrealizedPnL = useSetAtom(fetchUnrealizedPnLAtom);
  const fetchRealizedPnL = useSetAtom(fetchRealizedPnLAtom);
  const fetchEarnings = useSetAtom(fetchEarningsAtom);
  const fetchPoolShare = useSetAtom(fetchPoolShareAtom);
  const fetchPoolTokensUSDBalance = useSetAtom(fetchPoolTokensUSDBalanceAtom);
  const fetchStrategySyntheticPosition = useSetAtom(fetchStrategySyntheticPositionAtom);
  const poolUsdPriceMap = useSetAtom(poolUsdPriceMapAtom);

  const fetchRealizedPnLRef = useRef(false);
  const fetchUnrealizedPnLRef = useRef(false);
  const fetchEarningsRef = useRef(false);
  const fetchPoolShareRef = useRef(false);
  const fetchPoolTokensUSDBalanceRef = useRef(false);
  const fetchStrategySyntheticPositionRef = useRef(false);
  const poolUsdPriceMapRef = useRef(false);

  useEffect(() => {
    if (!address || !isEnabledChain(chainId) || fetchRealizedPnLRef.current) {
      return;
    }

    fetchRealizedPnLRef.current = true;
    fetchRealizedPnL(address, chainId)
      .then()
      .finally(() => {
        fetchRealizedPnLRef.current = false;
      });
  }, [chainId, address, pools, fetchRealizedPnL]);

  useEffect(() => {
    if (!address || !isEnabledChain(chainId) || fetchUnrealizedPnLRef.current) {
      return;
    }

    fetchUnrealizedPnLRef.current = true;
    fetchUnrealizedPnL(address, chainId)
      .then()
      .finally(() => {
        fetchUnrealizedPnLRef.current = false;
      });
  }, [address, chainId, poolUsdPrice, fetchUnrealizedPnL]);

  useEffect(() => {
    if (!address || !isEnabledChain(chainId) || fetchEarningsRef.current) {
      return;
    }

    fetchEarningsRef.current = true;
    fetchEarnings(address, chainId)
      .then()
      .finally(() => {
        fetchEarningsRef.current = false;
      });
  }, [address, chainId, poolUsdPrice, pools, fetchEarnings]);

  useEffect(() => {
    if (!address || fetchPoolShareRef.current) {
      return;
    }

    fetchPoolShareRef.current = true;
    fetchPoolShare(address)
      .then()
      .finally(() => {
        fetchPoolShareRef.current = false;
      });
  }, [address, traderAPI, poolUsdPrice, pools, fetchPoolShare]);

  useEffect(() => {
    if (!address || fetchPoolTokensUSDBalanceRef.current) {
      return;
    }

    fetchPoolTokensUSDBalanceRef.current = true;
    fetchPoolTokensUSDBalance(address)
      .then()
      .finally(() => {
        fetchPoolTokensUSDBalanceRef.current = false;
      });
  }, [address, poolUsdPrice, pools, fetchPoolTokensUSDBalance]);

  useEffect(() => {
    if (!address || !isEnabledChain(chainId) || fetchStrategySyntheticPositionRef.current) {
      return;
    }

    fetchStrategySyntheticPositionRef.current = true;
    fetchStrategySyntheticPosition(address, chainId)
      .then()
      .finally(() => {
        fetchStrategySyntheticPositionRef.current = false;
      });
  }, [address, chainId, traderAPI, fetchStrategySyntheticPosition]);

  useEffect(() => {
    if (poolUsdPriceMapRef.current) {
      return;
    }

    poolUsdPriceMapRef.current = true;
    poolUsdPriceMap(openRewards)
      .then()
      .finally(() => {
        poolUsdPriceMapRef.current = false;
      });
  }, [openRewards, traderAPI, pools, poolUsdPriceMap]);
};

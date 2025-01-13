import { useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import {
  clearOpenOrdersAtom,
  clearPositionsAtom,
  fundingListAtom,
  perpetualStatisticsAtom,
  poolsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  tradesHistoryAtom,
} from 'store/pools.store';

export const ChainSwitchHandler = () => {
  const setSelectedPool = useSetAtom(selectedPoolAtom);
  const setSelectedPerpetual = useSetAtom(selectedPerpetualAtom);
  const setPerpetualStatistics = useSetAtom(perpetualStatisticsAtom);
  const setPools = useSetAtom(poolsAtom);
  const clearPositions = useSetAtom(clearPositionsAtom);
  const clearOpenOrders = useSetAtom(clearOpenOrdersAtom);
  const setFundingList = useSetAtom(fundingListAtom);
  const setTradesHistory = useSetAtom(tradesHistoryAtom);

  const location = useLocation();
  const navigate = useNavigate();

  const { isConnected, isReconnecting, chainId } = useAccount();
  const chainIdRef = useRef<number | null>();

  useEffect(() => {
    if (isReconnecting || !isConnected) {
      chainIdRef.current = null;
      return;
    }

    // Check if this is a URL-driven chain switch
    const chainIdFromUrl = parseInt(location.hash.split('__')[1]?.split('=')[1], 10);
    const isUrlDrivenChainSwitch = chainIdFromUrl && chainIdFromUrl === chainId;

    if (chainIdRef.current !== chainId) {
      if (chainIdRef.current !== null) {
        setPools([]);
        clearPositions();
        clearOpenOrders();
        setFundingList([]);
        setTradesHistory([]);
        setPerpetualStatistics(null);

        // Only clear market selection and URL if this is NOT a URL-driven chain switch
        if (!isUrlDrivenChainSwitch) {
          setSelectedPool('');
          setSelectedPerpetual(0);
          navigate(`${location.pathname}${location.search}`);
        }
      }

      chainIdRef.current = chainId;
    }
  }, [
    isConnected,
    isReconnecting,
    chainId,
    setPools,
    clearPositions,
    clearOpenOrders,
    setFundingList,
    setTradesHistory,
    setSelectedPool,
    setSelectedPerpetual,
    setPerpetualStatistics,
    navigate,
    location.pathname,
    location.search,
    location.hash,
  ]);

  return null;
};

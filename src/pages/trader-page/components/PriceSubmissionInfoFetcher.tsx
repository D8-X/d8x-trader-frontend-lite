import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useLocation } from 'react-router-dom';

import { createSymbol } from 'helpers/createSymbol';
import { selectedPerpetualAtom, selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import { fetchPriceSubmissionInfoAtom } from 'store/order-block.store';
import { getEnabledChainId } from 'utils/getEnabledChainId';

const REFETCH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export const PriceSubmissionInfoFetcher = () => {
  const { chainId } = useAccount();
  const location = useLocation();

  const fetchPriceSubmissionInfo = useSetAtom(fetchPriceSubmissionInfoAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const traderAPI = useAtomValue(traderAPIAtom);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestInProgressRef = useRef(false);

  const symbol = useMemo(() => {
    if (selectedPool?.poolSymbol && selectedPerpetual?.baseCurrency && selectedPerpetual?.quoteCurrency) {
      return createSymbol({
        baseCurrency: selectedPerpetual.baseCurrency,
        quoteCurrency: selectedPerpetual.quoteCurrency,
        poolSymbol: selectedPool.poolSymbol,
      });
    }
    return '';
  }, [selectedPool?.poolSymbol, selectedPerpetual?.baseCurrency, selectedPerpetual?.quoteCurrency]);

  // Fetch on perpetual change
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!symbol || !traderAPI) {
      return;
    }

    const enabledChainId = getEnabledChainId(chainId, location.hash);
    if (Number(traderAPI.chainId) !== enabledChainId) {
      return;
    }

    const doFetch = async () => {
      if (requestInProgressRef.current) {
        return;
      }
      requestInProgressRef.current = true;
      try {
        await fetchPriceSubmissionInfo(symbol);
      } finally {
        requestInProgressRef.current = false;
      }
    };

    // Fetch immediately on change
    doFetch();

    // Set up interval to refetch every 2 minutes
    intervalRef.current = setInterval(() => {
      doFetch();
    }, REFETCH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [symbol, traderAPI, chainId, location, fetchPriceSubmissionInfo]);

  return null;
};

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { getCoingeckoData } from 'network/network';
import { isEnabledChain } from 'utils/isEnabledChain';
import type { PerpetualStatisticsI } from 'types/types';

export const useOpenInterest = (perpetualStatistics: PerpetualStatisticsI | null) => {
  const [openInterest, setOpenInterest] = useState<number | null>(null);
  const { chainId } = useAccount();
  const isRequestSent = useRef(false);

  useEffect(() => {
    // Clear open interest if no statistics
    if (!perpetualStatistics) {
      setOpenInterest(null);
      return;
    }

    // Skip if request already in progress or missing required data
    if (
      isRequestSent.current ||
      !chainId ||
      !isEnabledChain(chainId) ||
      !perpetualStatistics.baseCurrency ||
      !perpetualStatistics.quoteCurrency
    ) {
      return;
    }

    isRequestSent.current = true;

    getCoingeckoData(chainId)
      .then((data) => {
        // Get 24h open interest from backend
        const basePart = perpetualStatistics.baseCurrency;
        const quotePart = perpetualStatistics.quoteCurrency;
        const collateralPart = perpetualStatistics.poolName;

        // Find selected perpetual contract
        const matchingContract = data.contracts.find((contract) => {
          const ticker = contract.ticker_id;
          return ticker.startsWith(`${basePart}-${quotePart}-${collateralPart}`);
        });

        if (matchingContract) {
          setOpenInterest(matchingContract.open_interest);
        } else {
          // No match found, keep using the API value
          setOpenInterest(null);
        }
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setOpenInterest(null);
      })
      .finally(() => {
        isRequestSent.current = false;
      });

    return () => {
      isRequestSent.current = false;
    };
  }, [chainId, perpetualStatistics]);

  // Return 24h max OI if available, otherwise fall back to perpetualStatistics OI measure
  return openInterest !== null ? openInterest : perpetualStatistics?.openInterestBC || 0;
};

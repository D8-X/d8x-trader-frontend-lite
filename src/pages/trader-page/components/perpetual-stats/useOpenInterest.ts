import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { getCoingeckoData } from 'network/network';
import { isEnabledChain } from 'utils/isEnabledChain';
import { config } from 'config';

export const useOpenInterest = (props: { contractSymbol: string; currentOI: number } | undefined) => {
  const [openInterest, setOpenInterest] = useState<number | null>(null);
  const { chainId } = useAccount();
  const isRequestSent = useRef(false);

  useEffect(() => {
    // Clear open interest if no statistics
    if (!props) {
      setOpenInterest(null);
      return;
    }

    const chainIdForOI = isEnabledChain(chainId) ? chainId : config.enabledChains[0];

    // Skip if request already in progress or missing required data
    if (isRequestSent.current || !chainIdForOI || !isEnabledChain(chainIdForOI) || !props) {
      return;
    }

    isRequestSent.current = true;
    getCoingeckoData(chainIdForOI)
      .then((data) => {
        // Get 24h open interest from backend
        // Find selected perpetual contract
        const matchingContract = data.contracts.find((contract) => {
          const ticker = contract.ticker_id;
          return ticker.startsWith(props.contractSymbol);
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
  }, [chainId, props]);

  // Return 24h max OI if available, otherwise fall back to perpetualStatistics OI measure
  return openInterest !== null ? openInterest : props?.currentOI || 0;
};

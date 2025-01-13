import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useLocation } from 'react-router-dom';

import { createSymbol } from 'helpers/createSymbol';
import { getPerpetualStaticInfo } from 'network/network';
import { perpetualStaticInfoAtom, selectedPerpetualAtom, selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import { getEnabledChainId } from 'utils/getEnabledChainId';

export const PerpetualInfoFetcher = () => {
  const { chainId } = useAccount();
  const location = useLocation();

  const setPerpetualStaticInfo = useSetAtom(perpetualStaticInfoAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const traderAPI = useAtomValue(traderAPIAtom);

  const requestSentRef = useRef(false);

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

  useEffect(() => {
    if (requestSentRef.current) {
      return;
    }

    if (!symbol) {
      setPerpetualStaticInfo(null);
      return;
    }

    requestSentRef.current = true;

    getPerpetualStaticInfo(getEnabledChainId(chainId, location.hash), traderAPI, symbol)
      .then(({ data }) => {
        if (data.error) {
          throw new Error(data.error);
        } else {
          setPerpetualStaticInfo(data);
        }
      })
      .catch((error) => {
        console.error(error);
        setPerpetualStaticInfo(null);
      })
      .finally(() => {
        requestSentRef.current = false;
      });

    return () => {
      requestSentRef.current = false;
    };
  }, [chainId, symbol, setPerpetualStaticInfo, traderAPI, location]);

  return null;
};

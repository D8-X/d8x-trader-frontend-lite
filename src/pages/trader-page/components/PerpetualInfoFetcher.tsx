import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';

import { createSymbol } from 'helpers/createSymbol';
import { getPerpetualStaticInfo } from 'network/network';
import { perpetualStaticInfoAtom, selectedPerpetualAtom, selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import { isEnabledChain } from 'utils/isEnabledChain';

export const PerpetualInfoFetcher = () => {
  const { chainId } = useAccount();

  const setPerpetualStaticInfo = useSetAtom(perpetualStaticInfoAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const traderAPI = useAtomValue(traderAPIAtom);

  const requestSentRef = useRef(false);

  const symbol = useMemo(() => {
    if (selectedPool && selectedPerpetual) {
      return createSymbol({
        baseCurrency: selectedPerpetual.baseCurrency,
        quoteCurrency: selectedPerpetual.quoteCurrency,
        poolSymbol: selectedPool.poolSymbol,
      });
    }
    return '';
  }, [selectedPool, selectedPerpetual]);

  useEffect(() => {
    if (requestSentRef.current) {
      return;
    }

    if (!symbol || !isEnabledChain(chainId) || !traderAPI || chainId !== traderAPI.chainId) {
      setPerpetualStaticInfo(null);
      return;
    }

    requestSentRef.current = true;

    getPerpetualStaticInfo(chainId, traderAPI, symbol)
      .then(({ data }) => {
        setPerpetualStaticInfo(data);
      })
      .catch(console.error)
      .finally(() => {
        requestSentRef.current = false;
      });
  }, [chainId, symbol, setPerpetualStaticInfo, traderAPI]);

  return null;
};

import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useChainId, useNetwork } from 'wagmi';

import { createSymbol } from 'helpers/createSymbol';
import { getPerpetualStaticInfo } from 'network/network';
import { perpetualStaticInfoAtom, selectedPerpetualAtom, selectedPoolAtom, traderAPIAtom } from 'store/pools.store';

export const useSetPerpetualInfo = () => {
  const { chain } = useNetwork();
  const chainId = useChainId();

  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const setPerpetualStaticInfo = useSetAtom(perpetualStaticInfoAtom);
  const [traderAPI] = useAtom(traderAPIAtom);

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
    if (symbol && chainId && chainId === chain?.id) {
      getPerpetualStaticInfo(chainId, traderAPI, symbol)
        .then(({ data }) => {
          setPerpetualStaticInfo(data);
        })
        .catch(console.error);
    }
  }, [chain, chainId, symbol, setPerpetualStaticInfo, traderAPI]);
};

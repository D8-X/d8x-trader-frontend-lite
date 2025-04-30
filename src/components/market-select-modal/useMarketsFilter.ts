import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { SelectItemI } from '../header/elements/header-select/types';
import { searchFilterAtom } from './elements/search-input/SearchInput';
import { assetTypeFilterAtom, collateralFilterAtom } from './collaterals.store';
import { PerpetualWithPoolAndMarketI } from './types';
import { flatTokenAtom } from 'store/pools.store';
import { AssetTypeE } from 'types/enums';

export const useMarketsFilter = (markets: SelectItemI<PerpetualWithPoolAndMarketI>[]) => {
  const collateralFilter = useAtomValue(collateralFilterAtom);
  const searchFilter = useAtomValue(searchFilterAtom);
  const assetTypeFilter = useAtomValue(assetTypeFilterAtom);
  const flatToken = useAtomValue(flatTokenAtom);

  const filteredMarkets = useMemo(() => {
    let collateralFiltered;
    if (collateralFilter === null) {
      collateralFiltered = markets;
    } else {
      collateralFiltered = markets.filter((market) => {
        return (
          market.item.settleSymbol === collateralFilter ||
          (flatToken &&
            flatToken.poolId === Math.floor(market.item.id / 100_000) &&
            flatToken.registeredSymbol === collateralFilter)
        );
      });
    }

    if (assetTypeFilter === null) {
      return collateralFiltered;
    }

    if (assetTypeFilter === AssetTypeE.Commodity) {
      return collateralFiltered.filter(
        (market) =>
          market.item.marketData?.assetType === AssetTypeE.Commodity ||
          market.item.marketData?.assetType === AssetTypeE.Metal
      );
    }

    return collateralFiltered.filter((market) => assetTypeFilter === market.item.marketData?.assetType);
  }, [markets, collateralFilter, assetTypeFilter, flatToken]);

  return useMemo(() => {
    const checkStr = searchFilter.toLowerCase();
    return [...filteredMarkets]
      .filter(
        (market) =>
          market.item.baseCurrency.toLowerCase().includes(checkStr) ||
          market.item.quoteCurrency.toLowerCase().includes(checkStr)
      )
      .sort((a, b) => {
        const bIndex = b.item.baseCurrency.toLowerCase().indexOf(checkStr);
        const aIndex = a.item.baseCurrency.toLowerCase().indexOf(checkStr);
        if (aIndex === -1) {
          return 1;
        }
        if (bIndex === -1) {
          return -1;
        }
        if (aIndex < bIndex) {
          return -1;
        }
        if (bIndex < aIndex) {
          return 1;
        }
        return 0;
      });
  }, [filteredMarkets, searchFilter]);
};

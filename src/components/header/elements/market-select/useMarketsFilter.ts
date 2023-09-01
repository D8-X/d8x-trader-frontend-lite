import { useAtom } from 'jotai';
import { useMemo } from 'react';

import { SelectItemI } from '../header-select/types';
import { searchFilterAtom } from './components/search-input/SearchInput';
import { collateralFilterAtom, groupFilterAtom } from './collaterals.store';
import { tokenGroups } from './constants';
import { PerpetualWithPoolI } from './types';

export const useMarketsFilter = (markets: SelectItemI<PerpetualWithPoolI>[]) => {
  const [collateralFilter] = useAtom(collateralFilterAtom);
  const [searchFilter] = useAtom(searchFilterAtom);
  const [groupFilter] = useAtom(groupFilterAtom);

  const filteredMarkets = useMemo(() => {
    let collateralFiltered;
    if (collateralFilter === null) {
      collateralFiltered = markets;
    } else {
      collateralFiltered = markets.filter((market) => market.item.poolSymbol === collateralFilter);
    }

    if (groupFilter === null) {
      return collateralFiltered;
    }

    const groupToFilter = tokenGroups[groupFilter];
    return collateralFiltered.filter((market) => groupToFilter.includes(market.item.baseCurrency));
  }, [markets, collateralFilter, groupFilter]);

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
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        if (aIndex < bIndex) return -1;
        if (bIndex < aIndex) return 1;
        return 0;
      });
  }, [filteredMarkets, searchFilter]);
};

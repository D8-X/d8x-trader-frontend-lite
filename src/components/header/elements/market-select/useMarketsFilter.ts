import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { SelectItemI } from '../header-select/types';
import { collateralFilterAtom, defaultCollateralFilter } from './collaterals.store';
import { searchFilterAtom } from './components/SearchInput/SearchInput';
import { groupFilterAtom, tokenGroups } from './components/Tabs/Tabs';
import { PerpetualWithPoolI } from './types';

export const useMarketsFilter = (markets: SelectItemI<PerpetualWithPoolI>[]) => {
  const [collateralFilter] = useAtom(collateralFilterAtom);
  const [groupFilter] = useAtom(groupFilterAtom);

  const filteredMarkets = useMemo(() => {
    let collateralFiltered;
    if (collateralFilter === defaultCollateralFilter) {
      collateralFiltered = markets;
    } else {
      collateralFiltered = markets.filter((market) => market.item.poolSymbol === collateralFilter);
    }

    if (groupFilter === null) {
      return collateralFiltered;
    }
    const groupToFilter = tokenGroups[groupFilter];
    const groupFiltered = collateralFiltered.filter((market) => groupToFilter.includes(market.item.baseCurrency));
    return groupFiltered;
  }, [markets, collateralFilter, groupFilter]);

  const [searchFilter] = useAtom(searchFilterAtom);

  const textFilteredMarkets = useMemo(() => {
    const checkStr = searchFilter.toLowerCase();
    const newMarkets = [...filteredMarkets]
      .filter((market) => market.item.baseCurrency.toLowerCase().includes(checkStr))
      .sort((a, b) => {
        const bIndex = b.item.baseCurrency.toLowerCase().indexOf(checkStr);
        const aIndex = a.item.baseCurrency.toLowerCase().indexOf(checkStr);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        if (aIndex < bIndex) return -1;
        if (bIndex < aIndex) return 1;
        return 0;
      });
    return newMarkets;
  }, [filteredMarkets, searchFilter]);

  console.log('markets :>> ', { collateralFilter, markets, filteredMarkets, textFilteredMarkets });

  return textFilteredMarkets;
};

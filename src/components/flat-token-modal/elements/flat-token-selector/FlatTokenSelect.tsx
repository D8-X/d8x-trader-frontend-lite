import { useAtom, useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { SidesRow } from 'components/sides-row/SidesRow';
import { flatTokenAtom, poolsAtom, selectedStableAtom } from 'store/pools.store';

export const FlatTokenSelect = () => {
  const flatToken = useAtomValue(flatTokenAtom);
  const [selectedStable, setSelectedStable] = useAtom(selectedStableAtom);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pools = useAtomValue(poolsAtom);

  const supportedTokens = useMemo(() => {
    if (flatToken?.isFlatToken && pools) {
      return flatToken.supportedTokens.map(({ symbol, address }) => {
        const poolForToken = pools.find(({ settleTokenAddr }) => settleTokenAddr === address);
        return { symbol: poolForToken?.poolSymbol ?? symbol, address: address };
      });
    }
  }, [pools, flatToken]);

  return (
    <SidesRow
      leftSide={'Supported Tokens'}
      rightSide={
        <DropDownSelect
          id="token-dropdown"
          selectedValue={supportedTokens?.find(({ address }) => address === selectedStable)?.symbol}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          fullWidth
        >
          {supportedTokens?.map((item) => (
            <DropDownMenuItem
              key={item.address}
              option={item.symbol}
              isActive={item.address === selectedStable}
              onClick={() => {
                setSelectedStable(item.address);
                setAnchorEl(null);
              }}
            />
          ))}
        </DropDownSelect>
      }
    />
  );
};

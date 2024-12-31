import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { SidesRow } from 'components/sides-row/SidesRow';
import { flatTokenAtom, selectedStableAtom } from 'store/pools.store';

export const FlatTokenSelect = () => {
  const flatToken = useAtomValue(flatTokenAtom);
  const [seletedStable, setSelectedStable] = useAtom(selectedStableAtom);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  return (
    <SidesRow
      leftSide={'Supported Tokens'}
      rightSide={
        <DropDownSelect
          id="token-dropdown"
          selectedValue={seletedStable}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          fullWidth
        >
          {/* <DropDownMenuItem
            option={'-'}
            isActive={flatToken?.registeredToken == undefined}
            onClick={() => {
              setAnchorEl(null);
            }}
          /> */}
          {flatToken?.supportedTokens.map((item) => (
            <DropDownMenuItem
              key={item}
              option={item}
              isActive={item === seletedStable}
              onClick={() => {
                setSelectedStable(item);
                setAnchorEl(null);
              }}
            />
          ))}
        </DropDownSelect>
      }
    />
  );
};

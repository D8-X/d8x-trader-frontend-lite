import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { SidesRow } from 'components/sides-row/SidesRow';
import { flatTokenAtom } from 'store/pools.store';

import { FlatTokenI } from 'types/types';

export const FlatTokenSelect = ({ flatToken }: { flatToken: FlatTokenI }) => {
  const { t } = useTranslation();

  const setFlatToken = useSetAtom(flatTokenAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <SidesRow
      leftSide={t('common.currency-label')}
      rightSide={
        <DropDownSelect
          id="token-dropdown"
          selectedValue={flatToken.registeredToken}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          fullWidth
        >
          {flatToken.supportedTokens.map((item) => (
            <DropDownMenuItem
              key={item}
              option={item}
              isActive={item === flatToken.registeredToken}
              onClick={() => {
                setFlatToken({ ...flatToken, registeredToken: item });
                setAnchorEl(null);
              }}
            />
          ))}
        </DropDownSelect>
      }
    />
  );
};

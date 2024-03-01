import { useAtomValue } from 'jotai';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { SidesRow } from 'components/sides-row/SidesRow';
import { poolsAtom } from 'store/pools.store';
import type { PoolWithIdI } from 'types/types';

interface CurrencySelectPropsI {
  selectedPool?: PoolWithIdI | null;
  setSelectedPool: Dispatch<SetStateAction<PoolWithIdI | undefined>>;
}

export const CurrencySelect = ({ selectedPool, setSelectedPool }: CurrencySelectPropsI) => {
  const { t } = useTranslation();

  const pools = useAtomValue(poolsAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const activePools = useMemo(() => pools.filter((pool) => pool.isRunning), [pools]);

  useEffect(() => {
    if (activePools.length > 0) {
      setSelectedPool(activePools[0]);
    }
  }, [activePools, setSelectedPool]);

  return (
    <SidesRow
      leftSide={t('common.currency-label')}
      rightSide={
        <DropDownSelect
          id="currency-dropdown"
          selectedValue={selectedPool?.poolSymbol}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          fullWidth
        >
          {activePools.map((pool) => (
            <DropDownMenuItem
              key={pool.poolId}
              option={pool.poolSymbol}
              isActive={pool.poolId === selectedPool?.poolId}
              onClick={() => {
                setSelectedPool(pool);
                setAnchorEl(null);
              }}
            />
          ))}
        </DropDownSelect>
      }
    />
  );
};

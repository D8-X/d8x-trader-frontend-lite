import { useAtom } from 'jotai';
import { memo, useMemo } from 'react';

import { Box, MenuItem } from '@mui/material';

import { ReactComponent as CollateralIcon } from 'assets/icons/collateralIcon.svg';
import { liquidityPoolsAtom, selectedLiquidityPoolAtom } from 'store/vault-pools.store';
import { PoolI } from 'types/types';

import { HeaderSelect } from '../header-select/HeaderSelect';
import type { SelectItemI } from '../header-select/types';

import styles from '../header-select/HeaderSelect.module.scss';

const OptionsHeader = () => {
  return (
    <MenuItem className={styles.optionsHeader} disabled>
      <Box className={styles.leftLabel}>Liquidity Pool</Box>
      <Box className={styles.rightLabel}>No. of perps</Box>
    </MenuItem>
  );
};

export const LiquidityPoolsSelect = memo(() => {
  const [liquidityPools] = useAtom(liquidityPoolsAtom);
  const [selectedLiquidityPool, setSelectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);

  const handleChange = (newItem: PoolI) => {
    setSelectedLiquidityPool(newItem.poolSymbol);
  };

  const selectItems: SelectItemI<PoolI>[] = useMemo(() => {
    return liquidityPools
      .filter((pool) => pool.poolSymbol !== '')
      .map((pool) => ({ value: pool.poolSymbol, item: pool }));
  }, [liquidityPools]);

  return (
    <Box className={styles.holderRoot}>
      <Box className={styles.iconWrapper}>
        <CollateralIcon />
      </Box>
      <HeaderSelect<PoolI>
        id="liquidity-pools-select"
        label="Liquidity pool"
        items={selectItems}
        width="100%"
        value={selectedLiquidityPool?.poolSymbol}
        handleChange={handleChange}
        OptionsHeader={OptionsHeader}
        renderLabel={(value) => value.poolSymbol}
        renderOption={(option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            selected={option.value === selectedLiquidityPool?.poolSymbol}
          >
            <Box className={styles.optionHolder}>
              <Box className={styles.label}>{option.item.poolSymbol}</Box>
              <Box className={styles.value}>{option.item.perpetuals.length}</Box>
            </Box>
          </MenuItem>
        )}
      />
    </Box>
  );
});

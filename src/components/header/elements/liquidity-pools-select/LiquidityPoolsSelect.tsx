import { useAtom } from 'jotai';
import { memo, SyntheticEvent } from 'react';

import { Box, Paper } from '@mui/material';
import { PaperProps } from '@mui/material/Paper/Paper';

import { liquidityPoolsAtom, selectedLiquidityPoolAtom } from 'store/vault-pools.store';
import { PoolI } from 'types/types';

import { HeaderSelect } from '../header-select/HeaderSelect';

import styles from '../header-select/HeaderSelect.module.scss';
import { ReactComponent as CollateralIcon } from '../../../../assets/icons/collateralIcon.svg';

const CustomPaper = ({ children, ...props }: PaperProps) => {
  return (
    <Paper elevation={8} {...props}>
      <Box className={styles.optionsHeader}>
        <Box className={styles.leftLabel}>Liquidity Pool</Box>
        <Box className={styles.rightLabel}>No. of perps</Box>
      </Box>
      <Box className={styles.optionsHolder}>{children}</Box>
    </Paper>
  );
};

export const LiquidityPoolsSelect = memo(() => {
  const [liquidityPools] = useAtom(liquidityPoolsAtom);
  const [selectedLiquidityPool, setSelectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);

  const handleChange = (event: SyntheticEvent, value: PoolI) => {
    setSelectedLiquidityPool(value.poolSymbol);
  };

  return (
    <Box className={styles.holderRoot}>
      <Box className={styles.iconWrapper}>
        <CollateralIcon />
      </Box>
      <HeaderSelect<PoolI>
        id="liquidity-pools-select"
        label="Liquidity pool:"
        items={liquidityPools}
        width="100%"
        value={selectedLiquidityPool}
        onChange={handleChange}
        getOptionLabel={(option) => option.poolSymbol}
        PaperComponent={CustomPaper}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box className={styles.optionHolder}>
              <Box className={styles.label}>{option.poolSymbol}</Box>
              <Box className={styles.value}>{option.perpetuals.length}</Box>
            </Box>
          </Box>
        )}
      />
    </Box>
  );
});

import { useAtom } from 'jotai';
import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { liquidityTypeAtom, selectedLiquidityPoolAtom } from 'store/vault-pools.store';
import { LiquidityTypeE } from 'types/enums';

import { AddAction } from './elements/add-action/AddAction';
import { InitiateAction } from './elements/initiate-action/InitiateAction';
import { LiquidityTypeSelector } from './elements/liquidity-type-selector/LiquidityTypeSelector';
import { WithdrawAction } from './elements/withdraw-action/WithdrawAction';

import styles from './LiquidityBlock.module.scss';

export const LiquidityBlock = memo(() => {
  const [liquidityType] = useAtom(liquidityTypeAtom);
  const [selectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);

  return (
    <Box className={styles.root}>
      <Box className={styles.infoBlock}>
        <Typography variant="h5">{liquidityType} Liquidity</Typography>
        {liquidityType === LiquidityTypeE.Add && (
          <>
            <Typography variant="body2" className={styles.text}>
              Add liquidity to the {selectedLiquidityPool?.poolSymbol} pool and receive d
              {selectedLiquidityPool?.poolSymbol}, an ERC-20 token that represents your ownership in the liquidity pool.
            </Typography>
            <Typography variant="body2" className={styles.text}>
              As a liquidity provider, you'll earn trading fees and funding rate payments on all trades collateralized
              in {selectedLiquidityPool?.poolSymbol}. You'll also participate in the PnL of the pool. d
              {selectedLiquidityPool?.poolSymbol} accumulates fees, funding rate payments and PnL in real-time.
            </Typography>
          </>
        )}
        {liquidityType === LiquidityTypeE.Initiate && (
          <>
            <Typography variant="body2" className={styles.text}>
              Are you looking to withdraw your {selectedLiquidityPool?.poolSymbol} from the liquidity pool? If so, you
              can initiate a withdrawal request.
            </Typography>
            <Typography variant="body2" className={styles.text}>
              Keep in mind that it takes 48 hours to process your request and you can only have one withdrawal request
              at a time.
            </Typography>
          </>
        )}
        {liquidityType === LiquidityTypeE.Withdraw && (
          <>
            <Typography variant="body2" className={styles.text}>
              Withdraw {selectedLiquidityPool?.poolSymbol} from the pool.
            </Typography>
            <Typography variant="body2" className={styles.text}>
              Keep in mind that you need to initiate a withdrawal request before you can withdraw your funds. Once done,
              a withdrawable amount of d{selectedLiquidityPool?.poolSymbol} can be exchanged for{' '}
              {selectedLiquidityPool?.poolSymbol} at d{selectedLiquidityPool?.poolSymbol} price.
            </Typography>
          </>
        )}
      </Box>
      <Box className={styles.actionBlock}>
        <LiquidityTypeSelector />
        {liquidityType === LiquidityTypeE.Add && <AddAction />}
        {liquidityType === LiquidityTypeE.Initiate && <InitiateAction />}
        {liquidityType === LiquidityTypeE.Withdraw && <WithdrawAction />}
      </Box>
    </Box>
  );
});

import classNames from 'classnames';
import { useAtom } from 'jotai';
import { memo } from 'react';

import { Box, Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { expireDaysAtom, orderTypeAtom } from 'store/order-block.store';
import { ExpiryE, OrderTypeE } from 'types/enums';

import styles from './ExpirySelector.module.scss';

export const ExpirySelector = memo(() => {
  const [orderType] = useAtom(orderTypeAtom);
  const [expireDays, setExpireDays] = useAtom(expireDaysAtom);

  if (orderType === OrderTypeE.Market) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <Box className={styles.expiryOptions}>
        {Object.values(ExpiryE).map((key) => (
          <Button
            key={key}
            variant="outlined"
            className={classNames({ [styles.selected]: Number(key) === expireDays })}
            onClick={() => setExpireDays(Number(key))}
          >
            {key}
          </Button>
        ))}
      </Box>
      <OutlinedInput
        type="number"
        inputProps={{ min: 1, max: 365, step: 1 }}
        endAdornment={
          <InputAdornment position="end">
            <Typography variant="adornment">D</Typography>
          </InputAdornment>
        }
        onChange={(e) => setExpireDays(Number(e.target.value))}
        value={expireDays}
      />
    </Box>
  );
});

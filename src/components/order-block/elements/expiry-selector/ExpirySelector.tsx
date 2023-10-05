import classnames from 'classnames';
import { useAtom } from 'jotai';
import { ChangeEvent, memo, useState } from 'react';

import { Box, Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { expireDaysAtom, orderTypeAtom } from 'store/order-block.store';
import { ExpiryE, OrderTypeE } from 'types/enums';

import styles from './ExpirySelector.module.scss';

const MIN_EXPIRE = 1;
const MAX_EXPIRE = 365;

export const ExpirySelector = memo(() => {
  const [orderType] = useAtom(orderTypeAtom);
  const [expireDays, setExpireDays] = useAtom(expireDaysAtom);

  const [inputValue, setInputValue] = useState(`${expireDays}`);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const targetValue = event.target.value;
    if (targetValue) {
      const valueNumber = Number(targetValue);
      let valueToSet;
      if (valueNumber < MIN_EXPIRE) {
        valueToSet = MIN_EXPIRE;
      } else if (valueNumber > MAX_EXPIRE) {
        valueToSet = MAX_EXPIRE;
      } else {
        valueToSet = valueNumber;
      }
      setExpireDays(valueToSet);
      setInputValue(`${valueToSet}`);
    } else {
      setExpireDays(MIN_EXPIRE);
      setInputValue('');
    }
  };

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
            className={classnames({ [styles.selected]: Number(key) === expireDays })}
            onClick={() => {
              setExpireDays(Number(key));
              setInputValue(key);
            }}
          >
            {key}
          </Button>
        ))}
      </Box>
      <OutlinedInput
        type="number"
        inputProps={{ min: MIN_EXPIRE, max: MAX_EXPIRE, step: 1 }}
        endAdornment={
          <InputAdornment position="end">
            <Typography variant="adornment">D</Typography>
          </InputAdornment>
        }
        onChange={handleInputChange}
        value={inputValue}
      />
    </Box>
  );
});

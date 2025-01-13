import classnames from 'classnames';
import { useAtom, useAtomValue } from 'jotai';
import { ChangeEvent, memo, useState } from 'react';

import { Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { expireDaysAtom, orderTypeAtom } from 'store/order-block.store';
import { ExpiryE, OrderTypeE } from 'types/enums';

import styles from './ExpirySelector.module.scss';

const MIN_EXPIRE = 1;
const MAX_EXPIRE = 365;

export const ExpirySelector = memo(() => {
  const orderType = useAtomValue(orderTypeAtom);
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
    <div className={styles.root}>
      <div className={styles.expiryOptions}>
        {[ExpiryE['30D'], ExpiryE['90D'], ExpiryE['180D']].map((key) => (
          <Button
            key={key}
            variant="secondary"
            className={classnames({ [styles.selected]: Number(key) === expireDays })}
            onClick={() => {
              setExpireDays(Number(key));
              setInputValue(key);
            }}
          >
            {key}
          </Button>
        ))}
        <OutlinedInput
          type="number"
          inputProps={{ min: MIN_EXPIRE, max: MAX_EXPIRE, step: 1 }}
          className={styles.input}
          endAdornment={
            <InputAdornment position="end">
              <Typography variant="adornment">D</Typography>
            </InputAdornment>
          }
          onChange={handleInputChange}
          value={inputValue}
        />
      </div>
    </div>
  );
});

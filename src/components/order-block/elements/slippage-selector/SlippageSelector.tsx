import classnames from 'classnames';
import { useAtom, useAtomValue } from 'jotai';
import { ChangeEvent, memo, useState } from 'react';

import { Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { orderTypeAtom, slippageSliderAtom } from 'store/order-block.store';
import { OrderTypeE } from 'types/enums';

import styles from './SlippageSelector.module.scss';

const MIN_SLIPPAGE = 0.01;
const MAX_SLIPPAGE = 100000;
const MULTIPLIERS = [1, 2, 3, 5];

export const SlippageSelector = memo(() => {
  const orderType = useAtomValue(orderTypeAtom);
  const [slippage, setSlippage] = useAtom(slippageSliderAtom);

  const [inputValue, setInputValue] = useState(`${slippage}`);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const targetValue = event.target.value;
    if (targetValue) {
      const valueNumber = Number(targetValue);
      let valueToSet;
      if (valueNumber < MIN_SLIPPAGE) {
        valueToSet = MIN_SLIPPAGE;
      } else if (valueNumber > MAX_SLIPPAGE) {
        valueToSet = MAX_SLIPPAGE;
      } else {
        valueToSet = valueNumber;
      }
      setSlippage(valueToSet);
      setInputValue(`${valueToSet}`);
    } else {
      setSlippage(MIN_SLIPPAGE);
      setInputValue('');
    }
  };

  if (orderType !== OrderTypeE.Market) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.slippageOptions}>
        {MULTIPLIERS.map((key) => (
          <Button
            key={key}
            variant="secondary"
            className={classnames({ [styles.selected]: key === slippage })}
            onClick={() => {
              setSlippage(key);
              setInputValue(`${key}`);
            }}
          >
            {key}%
          </Button>
        ))}
        <OutlinedInput
          type="number"
          inputProps={{ min: MIN_SLIPPAGE, max: MAX_SLIPPAGE, step: 0.1 }}
          className={styles.input}
          endAdornment={
            <InputAdornment position="end">
              <Typography variant="adornment">%</Typography>
            </InputAdornment>
          }
          onChange={handleInputChange}
          value={inputValue}
        />
      </div>
    </div>
  );
});

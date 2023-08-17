import classnames from 'classnames';
import { type ChangeEvent, memo, type ReactNode, useCallback } from 'react';

import { Box, Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { ReactComponent as DecreaseIcon } from 'assets/icons/decreaseIcon.svg';
import { ReactComponent as IncreaseIcon } from 'assets/icons/increaseIcon.svg';

import styles from './ResponsiveInput.module.scss';

interface ResponsiveInputPropsI {
  id: string;
  className?: string;
  inputValue: string | number | null;
  setInputValue: (newValue: string) => void;
  handleInputBlur?: () => void;
  currency: string | undefined;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  adornmentAction?: ReactNode;
}

export const ResponsiveInput = memo((props: ResponsiveInputPropsI) => {
  const {
    id,
    className,
    inputValue,
    setInputValue,
    handleInputBlur,
    currency,
    placeholder,
    step = '1',
    min = -1,
    max,
    adornmentAction,
  } = props;

  const handleValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = +event.target.value;
      if (value < min) {
        setInputValue(`${min}`);
      } else if (max && value > max) {
        setInputValue(`${max}`);
      } else {
        setInputValue(event.target.value);
      }
    },
    [setInputValue, max, min]
  );

  const handleValueDecrease = useCallback(() => {
    if (inputValue === null) {
      return;
    }

    const parts = step.split('.');

    let decimalPlaces;
    if (parts.length === 2) {
      decimalPlaces = parts[1].length;
    } else {
      decimalPlaces = 0;
    }

    const stepNumber = +step;
    const rounded = Math.round((+inputValue - stepNumber) / stepNumber) * stepNumber;

    setInputValue(rounded.toFixed(decimalPlaces));
  }, [inputValue, setInputValue, step]);

  const handleValueIncrease = useCallback(() => {
    const parts = step.split('.');

    let decimalPlaces;
    if (parts.length === 2) {
      decimalPlaces = parts[1].length;
    } else {
      decimalPlaces = 0;
    }

    const stepNumber = +step;
    const inputNumber = inputValue === null ? 0 : +inputValue;
    const rounded = Math.round((inputNumber + stepNumber) / stepNumber) * stepNumber;

    setInputValue(rounded.toFixed(decimalPlaces));
  }, [inputValue, setInputValue, step]);

  const inputNumeric = inputValue !== null ? +inputValue : null;

  return (
    <Box className={classnames(styles.root, className)}>
      <Button
        key="decrease-input-value"
        variant="outlined"
        size="small"
        className={styles.decreaseButton}
        onClick={handleValueDecrease}
        disabled={inputNumeric === null || inputNumeric <= min}
      >
        <DecreaseIcon />
      </Button>
      <OutlinedInput
        id={id}
        endAdornment={
          <InputAdornment position="end">
            <Typography variant="adornment">{currency}</Typography>
            {adornmentAction}
          </InputAdornment>
        }
        inputProps={{ step, min, max }}
        type="number"
        placeholder={placeholder}
        onChange={handleValueChange}
        onBlur={handleInputBlur}
        value={inputNumeric === null ? '' : inputValue}
      />
      <Button
        key="increase-input-value"
        variant="outlined"
        size="small"
        className={styles.increaseButton}
        onClick={handleValueIncrease}
        disabled={!!(max && inputNumeric !== null && inputNumeric >= max)}
      >
        <IncreaseIcon />
      </Button>
    </Box>
  );
});

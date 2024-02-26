import classnames from 'classnames';
import { type ChangeEvent, memo, type ReactNode } from 'react';

import { Box, Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import DecreaseIcon from 'assets/icons/decreaseIcon.svg?react';
import IncreaseIcon from 'assets/icons/increaseIcon.svg?react';

import styles from './ResponsiveInput.module.scss';

interface ResponsiveInputPropsI {
  id: string;
  className?: string;
  inputClassName?: string;
  inputValue: string | number | null;
  setInputValue: (newValue: string) => void;
  handleInputBlur?: () => void;
  currency: ReactNode | undefined;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  adornmentAction?: ReactNode;
  disabled?: boolean;
}

export const ResponsiveInput = memo((props: ResponsiveInputPropsI) => {
  const {
    id,
    className,
    inputClassName,
    inputValue,
    setInputValue,
    handleInputBlur,
    currency,
    placeholder,
    step = '1',
    min = -1,
    max,
    adornmentAction,
    disabled,
  } = props;

  const handleValueChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = +event.target.value;
    if (value < min) {
      setInputValue(`${min}`);
    } else if (max && value > max) {
      setInputValue(`${max}`);
    } else {
      setInputValue(event.target.value);
    }
  };

  const handleValueDecrease = () => {
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
  };

  const handleValueIncrease = () => {
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
  };

  const inputNumeric = inputValue !== null ? +inputValue : null;

  return (
    <Box className={classnames(styles.root, className)}>
      <Button
        key="decrease-input-value"
        variant="outlined"
        size="small"
        className={styles.decreaseButton}
        onClick={handleValueDecrease}
        disabled={disabled || inputNumeric === null || inputNumeric <= min}
      >
        <DecreaseIcon />
      </Button>
      <OutlinedInput
        id={id}
        endAdornment={
          <InputAdornment position="end" className={styles.inputAdornment}>
            <Typography variant="adornment">{currency}</Typography>
            {adornmentAction}
          </InputAdornment>
        }
        className={inputClassName}
        inputProps={{ step, min, max }}
        type="number"
        placeholder={placeholder}
        onChange={handleValueChange}
        onBlur={handleInputBlur}
        value={inputNumeric === null ? '' : inputValue}
        disabled={disabled}
      />
      <Button
        key="increase-input-value"
        variant="outlined"
        size="small"
        className={styles.increaseButton}
        onClick={handleValueIncrease}
        disabled={disabled || !!(max && inputNumeric !== null && inputNumeric >= max)}
      >
        <IncreaseIcon />
      </Button>
    </Box>
  );
});

import classnames from 'classnames';
import { type ChangeEvent, type InputHTMLAttributes, memo, type ReactNode } from 'react';

import { InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { InputE } from './enums';

import styles from './ResponsiveInput.module.scss';

interface ResponsiveInputPropsI {
  id: string;
  className?: string;
  inputClassName?: string;
  inputValue: string | number | null;
  setInputValue: (newValue: string) => void;
  handleInputBlur?: () => void;
  handleInputFocus?: () => void;
  currency?: ReactNode;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  adornmentAction?: ReactNode;
  disabled?: boolean;
  type?: InputE;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

export const ResponsiveInput = memo((props: ResponsiveInputPropsI) => {
  const {
    id,
    className,
    inputClassName,
    inputValue,
    setInputValue,
    handleInputBlur,
    handleInputFocus,
    currency,
    placeholder,
    step = '1',
    min = -1,
    max,
    adornmentAction,
    disabled,
    type = InputE.Regular,
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

  const inputNumeric = inputValue !== null ? +inputValue : null;

  return (
    <div className={classnames(styles.root, className)}>
      <OutlinedInput
        id={id}
        startAdornment={
          type === InputE.Outlined && currency ? (
            <InputAdornment position="end" className={styles.inputStartAdornment}>
              <Typography variant="adornment">{currency}</Typography>
            </InputAdornment>
          ) : undefined
        }
        endAdornment={
          type === InputE.Regular && currency ? (
            <InputAdornment position="end" className={styles.inputEndAdornment}>
              <Typography variant="adornment">{currency}</Typography>
              {adornmentAction}
            </InputAdornment>
          ) : undefined
        }
        className={classnames(inputClassName, { [styles.outlined]: type === InputE.Outlined })}
        inputProps={{ step, min, max }}
        type="number"
        placeholder={placeholder}
        onChange={handleValueChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        value={inputNumeric === null ? '' : inputValue}
        disabled={disabled}
      />
    </div>
  );
});

import classnames from 'classnames';
import { ChangeEvent, ReactNode } from 'react';

import { Box, Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { genericMemo } from 'helpers/genericMemo';

import styles from './CustomPriceSelector.module.scss';

interface CustomPriceSelectorPropsI<T extends string> {
  id: string;
  label: ReactNode;
  options: T[];
  translationMap: Record<T, string>;
  handleInputPriceChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  validateInputPrice: () => void;
  handlePriceChange: (key: T) => void;
  selectedInputPrice: number | null | undefined;
  selectedPrice: T | null;
  currency?: string;
  stepSize: string;
  disabled?: boolean;
}

function CustomPriceSelectorComponent<T extends string>(props: CustomPriceSelectorPropsI<T>) {
  const {
    id,
    label,
    options,
    translationMap,
    handlePriceChange,
    handleInputPriceChange,
    validateInputPrice,
    selectedInputPrice,
    selectedPrice,
    currency,
    stepSize,
    disabled = false,
  } = props;

  return (
    <Box className={styles.root}>
      <Box className={styles.labelHolder}>
        {label}
        <OutlinedInput
          id={id}
          className={styles.customPriceInput}
          endAdornment={
            <InputAdornment position="end">
              <Typography variant="adornment">{currency}</Typography>
            </InputAdornment>
          }
          type="number"
          value={selectedInputPrice != null ? selectedInputPrice : ''}
          placeholder="-"
          onChange={handleInputPriceChange}
          onBlur={validateInputPrice}
          inputProps={{ step: stepSize, min: 0 }}
          disabled={disabled}
        />
      </Box>
      <Box className={styles.priceOptions}>
        {options.map((key) => (
          <Button
            key={key}
            variant="outlined"
            className={classnames({ [styles.selected]: key === selectedPrice })}
            onClick={() => handlePriceChange(key)}
            disabled={disabled}
          >
            {translationMap[key]}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

export const CustomPriceSelector = genericMemo(CustomPriceSelectorComponent);

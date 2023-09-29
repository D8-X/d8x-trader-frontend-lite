import { ChangeEvent, ReactNode } from 'react';
import classNames from 'classnames';

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
  selectedInputPrice: number | null;
  selectedPrice: T | null;
  currency?: string;
  stepSize: string;
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
  } = props;

  return (
    <Box className={styles.root}>
      <Box className={styles.labelHolder}>
        <Box className={styles.label}>{label}</Box>
        <OutlinedInput
          id={id}
          className={styles.customPriceInput}
          endAdornment={
            <InputAdornment position="end">
              <Typography variant="adornment">{currency}</Typography>
            </InputAdornment>
          }
          type="number"
          value={selectedInputPrice || ''}
          placeholder="-"
          onChange={handleInputPriceChange}
          onBlur={validateInputPrice}
          inputProps={{ step: stepSize, min: 0 }}
        />
      </Box>
      <Box className={styles.priceOptions}>
        {options.map((key) => (
          <Button
            key={key}
            variant="outlined"
            className={classNames({ [styles.selected]: key === selectedPrice })}
            onClick={() => handlePriceChange(key)}
          >
            {translationMap[key]}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

export const CustomPriceSelector = genericMemo(CustomPriceSelectorComponent);

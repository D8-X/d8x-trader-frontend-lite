import type { HTMLAttributes, JSXElementConstructor, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';

import { Box, FormControl, InputLabel, Select, SelectChangeEvent } from '@mui/material';

import { genericMemo } from 'helpers/genericMemo';

import { SelectItemI } from './types';

import styles from './HeaderSelect.module.scss';

interface HeaderSelectI<T> {
  id: string;
  label: string;
  native?: boolean;
  items: SelectItemI<T>[];
  width?: string | number;
  OptionsHeader?: JSXElementConstructor<HTMLAttributes<HTMLElement>>;
  handleChange: (newItem: T) => void;
  value: string | null | undefined;
  renderLabel: (value: T) => ReactNode;
  renderOption: (option: SelectItemI<T>) => ReactNode;
}

function HeaderSelectComponent<T>(props: HeaderSelectI<T>) {
  const {
    OptionsHeader,
    items,
    renderOption,
    renderLabel,
    label,
    native = false,
    id,
    value,
    width,
    handleChange,
  } = props;

  const children = useMemo(() => {
    return items.map((item) => renderOption(item));
  }, [items, renderOption]);

  const onChange = useCallback(
    (event: SelectChangeEvent) => {
      const newValue = event.target.value;
      if (newValue) {
        const foundItem = items.find((item) => item.value === newValue);
        if (foundItem) {
          handleChange(foundItem.item);
        }
      }
    },
    [items, handleChange]
  );

  const renderValue = useCallback(
    (valueForLabel: string) => {
      const foundItem = items.find((item) => item.value === valueForLabel);
      if (foundItem) {
        return renderLabel(foundItem.item);
      }
      return null;
    },
    [items, renderLabel]
  );

  if (!value) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <FormControl fullWidth variant="filled" className={styles.autocomplete}>
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          id={id}
          sx={{ width: width ?? 300 }}
          value={value}
          onChange={onChange}
          renderValue={renderValue}
          native={native}
        >
          {!native && OptionsHeader && <OptionsHeader />}
          {children}
        </Select>
      </FormControl>
    </Box>
  );
}

export const HeaderSelect = genericMemo(HeaderSelectComponent);

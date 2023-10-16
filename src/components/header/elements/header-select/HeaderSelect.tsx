import { Box, FormControl, InputLabel, Select, type SelectChangeEvent } from '@mui/material';
import { type HTMLAttributes, type JSXElementConstructor, type ReactNode, useMemo } from 'react';

import { genericMemo } from 'helpers/genericMemo';

import styles from './HeaderSelect.module.scss';
import { type SelectItemI } from './types';

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

  const onChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    if (newValue) {
      const foundItem = items.find((item) => item.value === newValue);
      if (foundItem) {
        handleChange(foundItem.item);
      }
    }
  };

  const renderValue = (valueForLabel: string) => {
    const foundItem = items.find((item) => item.value === valueForLabel);
    if (foundItem) {
      return renderLabel(foundItem.item);
    }
    return null;
  };

  if (!value) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <FormControl fullWidth variant="filled" className={styles.autocomplete}>
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          id={id}
          sx={{
            width: width ?? 300,
          }}
          inputProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  backgroundColor: 'var(--d8x-color-background)',
                },
              },
            },
          }}
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

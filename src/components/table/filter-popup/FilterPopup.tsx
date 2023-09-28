import { atom, useAtom } from 'jotai';
import { Dispatch, SetStateAction, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, OutlinedInput } from '@mui/material';

import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { TableHeaderI } from 'types/types';

import styles from './FilterPopup.module.scss';

export interface FilterI<T> {
  field?: keyof T;
  value?: string;
}

interface SortableHeaderPropsI<T> {
  headers: TableHeaderI<T>[];
  filter: FilterI<T>;
  setFilter: Dispatch<SetStateAction<FilterI<T>>>;
}

export const filterPopupIsOpenAtom = atom(false);

export function FilterPopup<T>({ headers, filter, setFilter }: SortableHeaderPropsI<T>) {
  const [isModalOpen, setModalOpen] = useAtom(filterPopupIsOpenAtom);
  // const [inputValue, setInputValue] = useState(filter.value);

  const [fieldAnchorEl, setFieldAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Dialog open={isModalOpen} onClose={() => setModalOpen(false)} className={styles.dialog}>
      <DialogTitle>Filter</DialogTitle>
      <DialogContent className={styles.filterBlock}>
        Field:
        <DropDownSelect
          id="field-dropdown"
          selectedValue={(filter.field as string) || (headers[0].field as string)}
          anchorEl={fieldAnchorEl}
          setAnchorEl={setFieldAnchorEl}
        >
          {headers.map((header) => (
            <DropDownMenuItem
              key={header.label.toString()}
              option={header.label as string}
              isActive={header.field === filter.field}
              onClick={() => {
                setFilter((v) => ({
                  field: header.field,
                  value: v.value,
                }));
                setFieldAnchorEl(null);
              }}
            />
          ))}
        </DropDownSelect>
        Type:
        <select>
          <option>=</option>
          <option>{'>'}</option>
          <option>{'<'}</option>
        </select>
        Value:
        <OutlinedInput
          id="filter"
          type="text"
          placeholder="value to filter"
          onChange={(e) => {
            // setInputValue(e.target.value);
            setFilter((v) => ({
              field: v.field || headers[0].field,
              value: e.target.value,
            }));
          }}
          value={filter.value || ''}
        />
        <Button onClick={() => setFilter({})} variant="outlined">
          Clear Filter
        </Button>
      </DialogContent>
      <DialogActions className={styles.modalActions}>
        <Button onClick={() => setModalOpen(false)} variant="secondary" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

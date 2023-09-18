import { atom, useAtom } from 'jotai';
import { Dispatch, SetStateAction } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { TableHeaderI } from 'types/types';

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

  return (
    <Dialog open={isModalOpen} onClose={() => setModalOpen(false)}>
      <DialogTitle>Filter</DialogTitle>
      <DialogContent>
        Field:
        <select
          onChange={(e) =>
            setFilter((v) => ({
              field: e.target.value as keyof T,
              value: v.value,
            }))
          }
          value={(filter.field as string) || (headers[0].field as string)}
        >
          {headers.map((header) => (
            <option key={header.label.toString()} value={header.field as string}>
              {header.label}
            </option>
          ))}
        </select>
        Type:
        <select>
          <option>=</option>
        </select>
        Value:
        <input
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
        <button onClick={() => setFilter({})}>Clear Filter</button>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setModalOpen(false)} variant="secondary" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

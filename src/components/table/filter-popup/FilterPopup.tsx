import { atom, useAtom } from 'jotai';
import { Dispatch, SetStateAction, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, OutlinedInput } from '@mui/material';

import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { FieldTypeE } from 'types/enums';
import { TableHeaderI } from 'types/types';

import styles from './FilterPopup.module.scss';

type FilterTypeT = '=' | '>' | '<';

const filterTypes: FilterTypeT[] = ['=', '>', '<'];

export interface FilterI<T> {
  field?: keyof T;
  value?: string;
  fieldType?: FieldTypeE;
  filterType?: FilterTypeT;
}

interface SortableHeaderPropsI<T> {
  headers: TableHeaderI<T>[];
  filter: FilterI<T>;
  setFilter: Dispatch<SetStateAction<FilterI<T>>>;
}

export const filterPopupIsOpenAtom = atom(false);

export function FilterPopup<T>({ headers, filter, setFilter }: SortableHeaderPropsI<T>) {
  const [isModalOpen, setModalOpen] = useAtom(filterPopupIsOpenAtom);

  const [fieldAnchorEl, setFieldAnchorEl] = useState<null | HTMLElement>(null);
  const [typeAnchorEl, setTypeAnchorEl] = useState<null | HTMLElement>(null);

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
                  ...v,
                  field: header.field,
                  fieldType: header.fieldType,
                }));
                setFieldAnchorEl(null);
              }}
            />
          ))}
        </DropDownSelect>
        {(filter.fieldType === FieldTypeE.Number || filter.fieldType === FieldTypeE.Date) && (
          <>
            Type:
            <DropDownSelect
              id="type-dropdown"
              selectedValue={(filter.filterType as string) || filterTypes[0]}
              anchorEl={typeAnchorEl}
              setAnchorEl={setTypeAnchorEl}
            >
              {filterTypes.map((filterType) => (
                <DropDownMenuItem
                  key={filterType}
                  option={filterType}
                  isActive={filterType === filter.filterType}
                  onClick={() => {
                    setFilter((v) => ({
                      ...v,
                      filterType: filterType,
                    }));
                    setTypeAnchorEl(null);
                  }}
                />
              ))}
            </DropDownSelect>
          </>
        )}
        Value:
        {filter.fieldType === FieldTypeE.Date ? (
          <input
            type="datetime-local"
            className={styles.dateInput}
            placeholder="date here"
            onChange={(e) =>
              setFilter((v) => ({
                ...v,
                field: v.field || headers[0].field,
                value: String(e.target.valueAsNumber / 1000),
              }))
            }
          />
        ) : (
          <OutlinedInput
            id="filter"
            type="text"
            placeholder="value to filter"
            onChange={(e) => {
              setFilter((v) => ({
                ...v,
                field: v.field || headers[0].field,
                value: e.target.value,
              }));
            }}
            value={filter.value || ''}
          />
        )}
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

import { Dispatch, SetStateAction, useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, OutlinedInput } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { FieldTypeE } from 'types/enums';
import { TableHeaderI } from 'types/types';

import { FilterModalContext } from './FilterModalContext';

import styles from './FilterModal.module.scss';

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

export function FilterModal<T>({ headers, filter, setFilter }: SortableHeaderPropsI<T>) {
  const { t } = useTranslation();

  const { isModalOpen, setModalOpen, setFilterApplied } = useContext(FilterModalContext);

  const [fieldAnchorEl, setFieldAnchorEl] = useState<null | HTMLElement>(null);
  const [typeAnchorEl, setTypeAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = useCallback(() => {
    setModalOpen?.(false);
  }, [setModalOpen]);

  return (
    <Dialog
      open={isModalOpen}
      onClose={handleClose}
      onCloseClick={handleClose}
      className={styles.dialog}
      dialogTitle={t('common.filter')}
      dialogContentClassName={styles.filterBlock}
    >
      <div className={styles.controlBlock}>
        {t('pages.trade.filter.field')}
        <DropDownSelect
          id="field-dropdown"
          selectedValue={headers.find((header) => header.field === filter.field)?.label || headers[0].label}
          anchorEl={fieldAnchorEl}
          setAnchorEl={setFieldAnchorEl}
          className={styles.fieldDropdown}
        >
          {headers.map((header) => (
            <DropDownMenuItem
              key={header.label.toString()}
              option={header.label as string}
              isActive={header.field === filter.field}
              onClick={() => {
                setFilterApplied(true);
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
      </div>
      {(filter.fieldType === FieldTypeE.Number || filter.fieldType === FieldTypeE.Date) && (
        <div className={styles.controlBlock}>
          {t('pages.trade.filter.type')}
          <DropDownSelect
            id="type-dropdown"
            selectedValue={(filter.filterType as string) || filterTypes[0]}
            anchorEl={typeAnchorEl}
            setAnchorEl={setTypeAnchorEl}
            className={styles.fieldDropdown}
          >
            {filterTypes.map((filterType) => (
              <DropDownMenuItem
                key={filterType}
                option={filterType}
                isActive={filterType === filter.filterType}
                onClick={() => {
                  setFilterApplied(true);
                  setFilter((v) => ({
                    ...v,
                    filterType: filterType,
                  }));
                  setTypeAnchorEl(null);
                }}
              />
            ))}
          </DropDownSelect>
        </div>
      )}
      <div className={styles.controlBlock}>
        {t('pages.trade.filter.value')}
        {filter.fieldType === FieldTypeE.Date ? (
          <input
            type="datetime-local"
            className={styles.dateInput}
            onChange={(e) => {
              setFilterApplied(true);
              setFilter((v) => ({
                ...v,
                field: v.field || headers[0].field,
                value: String(e.target.valueAsNumber / 1000),
              }));
            }}
          />
        ) : (
          <OutlinedInput
            id="filter"
            type="text"
            className={styles.input}
            placeholder={t('pages.trade.filter.value-placeholder')}
            onChange={(e) => {
              setFilterApplied(true);
              setFilter((v) => ({
                ...v,
                field: v.field || headers[0].field,
                value: e.target.value,
              }));
            }}
            value={filter.value || ''}
          />
        )}
      </div>
      <Button
        onClick={() => {
          setFilterApplied(false);
          setFilter({
            fieldType: headers[0].fieldType,
            filterType: '=',
          });
        }}
        variant="outlined"
      >
        {t('pages.trade.filter.clear')}
      </Button>
    </Dialog>
  );
}

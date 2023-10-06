import { useMemo, useState } from 'react';

import { FieldTypeE } from 'types/enums';
import { TableHeaderI } from 'types/types';

import { FilterI } from './FilterPopup';

const filterFunction = <T>(field: number, comparator: string, filter: FilterI<T>): boolean => {
  const { fieldType, filterType } = filter;

  if (fieldType === FieldTypeE.Number) {
    const comparatorNumber = Number(comparator);
    if (filterType === '=') {
      return field === comparatorNumber;
    } else if (filterType === '>') {
      return field >= comparatorNumber;
    } else if (filterType === '<') {
      return field <= comparatorNumber;
    }
  } else if (fieldType === FieldTypeE.Date) {
    const comparatorNumber = Number(comparator);
    let fieldConverted;
    if (typeof field === 'number') {
      fieldConverted = field;
    } else {
      fieldConverted = new Date(field).getTime() / 1000;
    }
    if (filterType === '=') {
      return fieldConverted === comparatorNumber;
    } else if (filterType === '>') {
      return fieldConverted >= comparatorNumber;
    } else if (filterType === '<') {
      return fieldConverted <= comparatorNumber;
    }
  }

  return String(field).toLowerCase().includes(comparator);
};

const filterRows = <T>(rows: T[], filter: FilterI<T>) => {
  if (filter.field && filter.value) {
    const checkStr = filter.value.toLowerCase();

    return rows.filter((row) => {
      // eslint-disable-next-line
      // @ts-ignore
      const filterField = row[filter.field];

      return filterFunction(filterField, checkStr, filter);
    });
  }
  return rows;
};

export const useFilter = <T, G>(rows: T[], headers: TableHeaderI<G>[]) => {
  const [filter, setFilter] = useState<FilterI<T>>({
    fieldType: headers[0].fieldType,
    filterType: '=',
  });
  const filteredRows = useMemo(() => filterRows(rows, filter), [rows, filter]);

  return { filter, setFilter, filteredRows };
};

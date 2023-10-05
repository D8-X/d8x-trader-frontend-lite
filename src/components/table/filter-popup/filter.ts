import { FieldTypeE } from 'types/enums';
import { FilterI } from './FilterPopup';

const filterFunction = <T>(field: number, comparator: string, filter: FilterI<T>): boolean => {
  const { fieldType, filterType } = filter;

  if (fieldType === FieldTypeE.Number) {
    if (filterType === '=') {
      return field === Number(comparator);
    } else if (filterType === '>') {
      return field >= Number(comparator);
    } else if (filterType === '<') {
      return field <= Number(comparator);
    }
  } else if (fieldType === FieldTypeE.Date) {
    if (filterType === '=') {
      return field === Number(comparator);
    } else if (filterType === '>') {
      return field >= Number(comparator);
    } else if (filterType === '<') {
      return field <= Number(comparator);
    }
  }

  return String(field).toLowerCase().includes(comparator);
};

export const filterRows = <T>(rows: T[], filter: FilterI<T>) => {
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

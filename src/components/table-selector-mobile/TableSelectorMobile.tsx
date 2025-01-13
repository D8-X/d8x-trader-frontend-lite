import { useState } from 'react';

import { MenuItem } from '@mui/material';

import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { type SelectorItemI } from 'components/table-selector/TableSelector';
import { Filter } from 'components/table-selector/elements/filter/Filter';
import { Refresher } from 'components/table-selector/elements/refresher/Refresher';
import { FilterModalProvider } from 'components/table/filter-modal/FilterModalContext';

import styles from './TableSelectorMobile.module.scss';

interface TableSelectorMobilePropsI {
  selectorItems: SelectorItemI[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export const TableSelectorMobile = ({ selectorItems, activeIndex, setActiveIndex }: TableSelectorMobilePropsI) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <FilterModalProvider>
      <div className={styles.root}>
        <div className={styles.dropdownHolder}>
          <DropDownSelect
            id="table-selector-dropdown"
            selectedValue={selectorItems[activeIndex]?.label}
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
            fullWidth
          >
            {selectorItems.map(({ label }, index) => (
              <MenuItem
                key={label}
                value={index}
                className={styles.dropdown}
                onClick={() => {
                  setActiveIndex(index);
                  setAnchorEl(null);
                }}
              >
                {label}
              </MenuItem>
            ))}
          </DropDownSelect>
        </div>
        <div className={styles.buttonsBlock}>
          <Filter activeTableType={selectorItems[activeIndex].tableType} />
          <Refresher activeTableType={selectorItems[activeIndex].tableType} />
        </div>
        <div>{selectorItems[activeIndex].item}</div>
      </div>
    </FilterModalProvider>
  );
};

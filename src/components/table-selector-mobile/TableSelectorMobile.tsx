import { useState } from 'react';

import { Box, MenuItem } from '@mui/material';

import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { type SelectorItemI } from 'components/table-selector/TableSelector';
import { Filter } from 'components/table-selector/elements/filter/Filter';
import { Refresher } from 'components/table-selector/elements/refresher/Refresher';
import { FilterPopupProvider } from 'components/table/filter-modal/FilterModalContext';

import styles from './TableSelectorMobile.module.scss';

interface TableSelectorMobilePropsI {
  selectorItems: SelectorItemI[];
}

export const TableSelectorMobile = ({ selectorItems }: TableSelectorMobilePropsI) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <FilterPopupProvider>
      <Box className={styles.root}>
        <DropDownSelect
          id="table-selector-dropdown"
          selectedValue={selectorItems[selectedIndex]?.label}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          className={styles.dropdownSelect}
          fullWidth
        >
          {selectorItems.map(({ label }, index) => (
            <MenuItem
              key={label}
              value={index}
              className={styles.dropdown}
              onClick={() => {
                setSelectedIndex(index);
                setAnchorEl(null);
              }}
            >
              {label}
            </MenuItem>
          ))}
        </DropDownSelect>

        <div className={styles.buttonsBlock}>
          <Filter activeTableType={selectorItems[selectedIndex].tableType} />
          <Refresher activeTableType={selectorItems[selectedIndex].tableType} />
        </div>
        <Box>{selectorItems[selectedIndex].item}</Box>
      </Box>
    </FilterPopupProvider>
  );
};

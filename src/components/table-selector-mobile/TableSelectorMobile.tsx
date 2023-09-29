import { useState } from 'react';

import { Box, MenuItem, Select, type SelectChangeEvent } from '@mui/material';

import { type SelectorItemI } from 'components/table-selector/TableSelector';
import { Refresher } from 'components/table-selector/elements/refresher/Refresher';

import styles from './TableSelectorMobile.module.scss';

interface TableSelectorMobilePropsI {
  selectorItems: SelectorItemI[];
}

export const TableSelectorMobile = ({ selectorItems }: TableSelectorMobilePropsI) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedIndex(+event.target.value);
  };

  return (
    <Box className={styles.root}>
      <Select value={`${selectedIndex}`} onChange={handleChange} className={styles.select}>
        {selectorItems.map(({ label }, index) => (
          <MenuItem key={label} value={index} className={styles.dropdown}>
            {label}
          </MenuItem>
        ))}
      </Select>
      <Refresher activeTableType={selectorItems[selectedIndex].tableType} />
      <Box>{selectorItems[selectedIndex].item}</Box>
    </Box>
  );
};

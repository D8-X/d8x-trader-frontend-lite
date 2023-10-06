import classnames from 'classnames';
import { type ReactNode } from 'react';

import { Box, Button, Card, CardContent, CardHeader } from '@mui/material';

import { FilterPopupProvider } from 'components/table/filter-popup/FilterPopupContext';
import { type TableTypeE } from 'types/enums';

import styles from './TableSelector.module.scss';
import { Filter } from './elements/filter/Filter';
import { Refresher } from './elements/refresher/Refresher';

export interface SelectorItemI {
  label: string;
  item: ReactNode;
  tableType: TableTypeE;
}

interface TableSelectorPropsI {
  selectorItems: SelectorItemI[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export const TableSelector = ({ selectorItems, activeIndex, setActiveIndex }: TableSelectorPropsI) => {
  return (
    <FilterPopupProvider>
      <Card className={styles.root}>
        <CardHeader
          className={styles.headerRoot}
          title={
            <Box className={styles.headerWrapper}>
              <Box className={styles.tableSelectorsWrapper}>
                {selectorItems.map(({ label }, index) => (
                  <Button
                    key={label}
                    variant="link"
                    onClick={() => setActiveIndex(index)}
                    className={classnames({ [styles.selected]: activeIndex === index })}
                  >
                    {label}
                  </Button>
                ))}
              </Box>
              <Filter />
              <Refresher activeTableType={selectorItems[activeIndex].tableType} />
            </Box>
          }
        />
        <CardContent className={styles.content}>{selectorItems[activeIndex].item}</CardContent>
      </Card>
    </FilterPopupProvider>
  );
};

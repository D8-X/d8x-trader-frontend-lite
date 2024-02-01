import classnames from 'classnames';
import { type ReactNode } from 'react';

import { Button, Card, CardContent, CardHeader } from '@mui/material';

import { FilterModalProvider } from 'components/table/filter-modal/FilterModalContext';
import { type TableTypeE } from 'types/enums';

import { Filter } from './elements/filter/Filter';
import { Refresher } from './elements/refresher/Refresher';

import styles from './TableSelector.module.scss';

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
    <FilterModalProvider>
      <Card className={styles.root}>
        <CardHeader
          className={styles.headerRoot}
          title={
            <div className={styles.headerWrapper}>
              <div className={styles.tableSelectorsWrapper}>
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
              </div>
              <Filter activeTableType={selectorItems[activeIndex].tableType} />
              <Refresher activeTableType={selectorItems[activeIndex].tableType} />
            </div>
          }
        />
        <CardContent className={styles.content}>{selectorItems[activeIndex].item}</CardContent>
      </Card>
    </FilterModalProvider>
  );
};

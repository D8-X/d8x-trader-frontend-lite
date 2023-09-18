import classnames from 'classnames';
import { useSetAtom } from 'jotai';
import { type ReactNode } from 'react';

import { Box, Button, Card, CardContent, CardHeader } from '@mui/material';

import { filterPopupIsOpenAtom } from 'components/table/filter-popup/FilterPopup';
import { type TableTypeE } from 'types/enums';

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
  const setModalOpen = useSetAtom(filterPopupIsOpenAtom);

  return (
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
            <button onClick={() => setModalOpen(true)}>Filter</button>
            <Refresher activeTableType={selectorItems[activeIndex].tableType} />
          </Box>
        }
      />
      <CardContent className={styles.content}>{selectorItems[activeIndex].item}</CardContent>
    </Card>
  );
};

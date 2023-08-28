import classnames from 'classnames';

import { Box, Button, Card, CardContent, CardHeader } from '@mui/material';

import { Refresher } from './elements/refresher/Refresher';

import { TableTypeE } from 'types/enums';

import styles from './TableSelector.module.scss';

export interface SelectorItemI {
  label: string;
  item: JSX.Element;
  tableType: TableTypeE;
}

interface TableSelectorPropsI {
  selectorItems: SelectorItemI[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export const TableSelector = ({ selectorItems, activeIndex, setActiveIndex }: TableSelectorPropsI) => {
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
            <Refresher activeTableType={selectorItems[activeIndex].tableType} />
          </Box>
        }
      />
      <CardContent className={styles.content}>{selectorItems[activeIndex].item}</CardContent>
    </Card>
  );
};

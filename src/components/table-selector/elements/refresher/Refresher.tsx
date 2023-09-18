import { useAtom } from 'jotai';

import { Box } from '@mui/material';

import { ReactComponent as RefreshIcon } from 'assets/icons/refreshIcon.svg';

import { tableRefreshHandlersAtom } from 'store/tables.store';

import { TableTypeE } from 'types/enums';

import styles from './Refresher.module.scss';

interface RefresherPropsI {
  activeTableType: TableTypeE;
}

export const Refresher = ({ activeTableType }: RefresherPropsI) => {
  const [tableRefreshHandlers] = useAtom(tableRefreshHandlersAtom);

  return (
    <Box className={styles.root} onClick={tableRefreshHandlers[activeTableType] ?? undefined}>
      <RefreshIcon className={styles.actionIcon} />
    </Box>
  );
};

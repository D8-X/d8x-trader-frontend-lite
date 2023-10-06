import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';

import { tableRefreshHandlersAtom } from 'store/tables.store';

import { TableTypeE } from 'types/enums';

import styles from './Refresher.module.scss';

interface RefresherPropsI {
  activeTableType: TableTypeE;
}

export const Refresher = ({ activeTableType }: RefresherPropsI) => {
  const { t } = useTranslation();
  const [tableRefreshHandlers] = useAtom(tableRefreshHandlersAtom);

  return (
    <Box className={styles.root} onClick={tableRefreshHandlers[activeTableType] ?? undefined}>
      <AutorenewOutlinedIcon className={styles.actionIcon} />
      <Typography variant="bodySmall" className={styles.refreshLabel}>
        {t('common.refresh')}
      </Typography>
    </Box>
  );
};

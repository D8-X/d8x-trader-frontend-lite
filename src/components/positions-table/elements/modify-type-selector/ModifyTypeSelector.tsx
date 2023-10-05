import classnames from 'classnames';
import type { Dispatch, SetStateAction } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button } from '@mui/material';

import styles from './ModifyTypeSelector.module.scss';

export enum ModifyTypeE {
  Add = 'Add',
  Remove = 'Remove',
}

interface ModifyTypeSelectorPropsI {
  modifyType: ModifyTypeE;
  setModifyType: Dispatch<SetStateAction<ModifyTypeE>>;
}

export const ModifyTypeSelector = memo(({ modifyType, setModifyType }: ModifyTypeSelectorPropsI) => {
  const { t } = useTranslation();

  return (
    <Box className={styles.root}>
      {Object.values(ModifyTypeE).map((key) => (
        <Button
          key={key}
          className={classnames({ [styles.selected]: key === modifyType })}
          variant={key === modifyType ? 'link' : 'link'}
          onClick={() => setModifyType(key)}
        >
          {t(`pages.trade.positions-table.modify-modal.selector.${ModifyTypeE[key].toLowerCase()}`)}
        </Button>
      ))}
    </Box>
  );
});

import { Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { FilterIcon } from 'assets/icons/Filter';
import { filterPopupIsOpenAtom } from 'components/table/filter-popup/FilterPopup';

import styles from './Filter.module.scss';

export const Filter = () => {
  const { t } = useTranslation();
  const setModalOpen = useSetAtom(filterPopupIsOpenAtom);

  return (
    <div className={styles.root} onClick={() => setModalOpen(true)}>
      <FilterIcon className={styles.actionIcon} isActive={false} />
      <Typography variant="bodySmall" className={styles.refreshLabel}>
        {t('common.filter')}
      </Typography>
    </div>
  );
};

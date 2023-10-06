import { Typography } from '@mui/material';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterIcon } from 'assets/icons/Filter';
import { FilterPopupContext } from 'components/table/filter-popup/FilterPopupContext';

import styles from './Filter.module.scss';

export const Filter = () => {
  const { t } = useTranslation();
  const [, setModalOpen] = useContext(FilterPopupContext);

  return (
    <div className={styles.root} onClick={() => setModalOpen?.(true)}>
      <FilterIcon className={styles.actionIcon} isActive={false} />
      <Typography variant="bodySmall" className={styles.refreshLabel}>
        {t('common.filter')}
      </Typography>
    </div>
  );
};

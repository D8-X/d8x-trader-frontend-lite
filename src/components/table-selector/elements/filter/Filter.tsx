import { Typography } from '@mui/material';
import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';

import { FilterModalContext } from 'components/table/filter-modal/FilterModalContext';
import { TableTypeE } from 'types/enums';

import styles from './Filter.module.scss';

interface FilterPropsI {
  activeTableType: TableTypeE;
}

export const Filter = ({ activeTableType }: FilterPropsI) => {
  const { t } = useTranslation();

  const { setModalOpen, isFilterApplied, setFilterApplied } = useContext(FilterModalContext);

  useEffect(() => {
    setFilterApplied(false);
  }, [activeTableType, setFilterApplied]);

  return (
    <div className={styles.root} onClick={() => setModalOpen(true)}>
      {isFilterApplied ? (
        <FilterAltOutlined className={styles.actionIcon} />
      ) : (
        <FilterAltOffOutlined className={styles.actionIcon} />
      )}
      <Typography variant="bodySmall" className={styles.refreshLabel}>
        {t('common.filter')}
      </Typography>
    </div>
  );
};

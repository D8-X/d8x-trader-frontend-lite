import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import styles from './Overview.module.scss';

export const Overview = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.root}>
      <Typography variant="h4" className={styles.title}>
        {t('pages.boost-station.title')}
      </Typography>
    </div>
  );
};

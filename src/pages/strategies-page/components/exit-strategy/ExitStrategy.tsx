import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { hasPositionAtom } from 'store/strategies.store';

import styles from './ExitStrategy.module.scss';

export const ExitStrategy = () => {
  const { t } = useTranslation();

  const setHasPosition = useSetAtom(hasPositionAtom);

  return (
    <div className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {t('pages.strategies.exit.title')}
      </Typography>
      <Typography variant="bodySmall" className={styles.note}>
        {t('pages.strategies.exit.note')}
      </Typography>
      <Button onClick={() => setHasPosition(false)} className={styles.button} variant="primary">
        <span className={styles.modalButtonText}>{t('pages.strategies.exit.exit-button')}</span>
      </Button>
    </div>
  );
};

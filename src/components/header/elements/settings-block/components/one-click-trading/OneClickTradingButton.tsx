import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Settings } from '@mui/icons-material';
import { Button, Tooltip, Typography } from '@mui/material';

import styles from './OneClickTradingButton.module.scss';
import { OneClickTradingModal } from './components/OneClickTradingModal';

export const OneClickTradingButton = () => {
  const { t } = useTranslation();

  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Tooltip title={t('common.settings.one-click-modal.modal-button')}>
        <Button onClick={() => setModalOpen(true)} className={styles.modalButton} variant="outlined">
          <Typography variant="bodyMedium" className={styles.modalButtonText}>
            {t('common.settings.one-click-modal.modal-button')}
          </Typography>
          <Settings />
        </Button>
      </Tooltip>
      <OneClickTradingModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

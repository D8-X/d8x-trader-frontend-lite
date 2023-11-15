import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Dialog } from 'components/dialog/Dialog';
import { LiFiWidgetHolder } from 'components/li-fi-widget/LiFiWidgetHolder';

import styles from './LiFiWidgetModal.module.scss';

interface LiFiWidgetModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const LiFiWidgetModal = ({ isOpen, onClose }: LiFiWidgetModalPropsI) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className={styles.dialogContent}>
        {isOpen && <LiFiWidgetHolder />}
        <Box className={styles.buttonsBlock}>
          <Button variant="secondary" className={styles.closeButton} onClick={onClose}>
            {t('common.info-modal.close')}
          </Button>
        </Box>
      </div>
    </Dialog>
  );
};

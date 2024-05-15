import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Box, Button } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { LiFiWidgetHolder } from 'components/li-fi-widget/LiFiWidgetHolder';
import { lifiModalOpenAtom } from 'store/global-modals.store';

import styles from './LiFiWidgetModal.module.scss';

export const LiFiWidgetModal = () => {
  const { t } = useTranslation();

  const [isOpen, setOpen] = useAtom(lifiModalOpenAtom);

  const onClose = () => setOpen(false);

  return (
    <Dialog open={isOpen} onCloseClick={onClose}>
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

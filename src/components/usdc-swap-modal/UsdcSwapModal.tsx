import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { UsdcSwapWidget } from 'components/usdc-swap-widget/UsdcSwapWidget';
import { Separator } from 'components/separator/Separator';

import styles from './UsdcSwapModal.module.scss';

interface UsdcSwapModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const UsdcSwapModal = ({ isOpen, onClose }: UsdcSwapModalPropsI) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose} className={styles.root}>
      <DialogTitle>{t('common.usdc-swap-widget.title')}</DialogTitle>
      <Separator />
      <DialogContent className={styles.dialogContent}>{t('common.usdc-swap-widget.message')}</DialogContent>
      <Separator />
      <DialogContent className={styles.dialogContent}>
        <UsdcSwapWidget />
      </DialogContent>
      <Separator />
      <DialogActions className={styles.modalActions}>
        <Button onClick={onClose} variant="secondary" size="small">
          {t('common.info-modal.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

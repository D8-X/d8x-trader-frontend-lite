import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { extractPKModalOpenAtom } from 'store/global-modals.store';

import styles from './ExtractPKModal.module.scss';

export const ExtractPKModal = () => {
  const { t } = useTranslation();

  const [isExtractPKModalOpen, setExtractPKModalOpen] = useAtom(extractPKModalOpenAtom);

  const handleOnClose = () => setExtractPKModalOpen(false);

  return (
    <Dialog open={isExtractPKModalOpen} onClose={handleOnClose} className={styles.dialog}>
      <DialogTitle>{t('common.extract-pk-modal.title')}</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <Separator />
        <div className={styles.section}>
          <Typography variant="bodyTiny" className={styles.noteText}>
            {t('common.extract-pk-modal.important-notice')}
          </Typography>
        </div>
        <Separator />
      </DialogContent>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={handleOnClose} variant="secondary">
          {t('common.info-modal.close')}
        </Button>
        <Button variant="primary">{t('common.extract-pk-modal.reveal-key-button')}</Button>
      </DialogActions>
    </Dialog>
  );
};

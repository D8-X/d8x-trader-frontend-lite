import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { extractPKModalOpenAtom } from 'store/global-modals.store';
import { socialPKAtom } from 'store/web3-auth.store';

import styles from './ExtractPKModal.module.scss';
import { CopyInput } from '../copy-input/CopyInput';

export const ExtractPKModal = () => {
  const { t } = useTranslation();

  const [isExtractPKModalOpen, setExtractPKModalOpen] = useAtom(extractPKModalOpenAtom);
  const socialPK = useAtomValue(socialPKAtom);

  const [showPK, setShowPR] = useState(false);

  const handleOnClose = () => {
    setExtractPKModalOpen(false);
    setShowPR(false);
  };

  return (
    <Dialog open={isExtractPKModalOpen} onClose={handleOnClose} className={styles.dialog}>
      <DialogTitle>{t('common.extract-pk-modal.title')}</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <Separator />
        {!showPK && (
          <div className={styles.section}>
            <Typography variant="bodyTiny" className={styles.noteText}>
              {t('common.extract-pk-modal.important-notice')}
            </Typography>
          </div>
        )}
        {showPK && (
          <div className={styles.section}>
            <CopyInput id="socialPK" textToCopy={socialPK || ''} />
          </div>
        )}
        <Separator />
      </DialogContent>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={handleOnClose} variant="secondary">
          {t('common.info-modal.close')}
        </Button>
        {!showPK && (
          <Button
            onClick={() => {
              setShowPR(true);
            }}
            variant="primary"
          >
            {t('common.extract-pk-modal.reveal-key-button')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { CopyInput } from 'components/copy-input/CopyInput';
import { Dialog } from 'components/dialog/Dialog';

import styles from './ExtractPKModal.module.scss';

interface ExtractPKModalPropsI {
  getPK: () => Promise<string | null>;
  isModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
}

export const ExtractPKModal = ({ getPK, isModalOpen, setModalOpen }: ExtractPKModalPropsI) => {
  const { t } = useTranslation();

  const [pk, setPK] = useState<string | null>(null);
  const [showPK, setShowPR] = useState(false);

  const handleOnClose = () => {
    setModalOpen(false);
    setShowPR(false);
  };

  useEffect(() => {
    if (showPK) {
      getPK().then((givenPK) => setPK(givenPK));
    }
  }, [showPK, getPK]);

  return (
    <Dialog
      open={isModalOpen}
      onClose={handleOnClose}
      onCloseClick={handleOnClose}
      className={styles.dialog}
      dialogTitle={t('common.extract-pk-modal.title')}
      footerActions={
        !showPK && (
          <>
            <Button onClick={handleOnClose} variant="secondary">
              {t('common.info-modal.close')}
            </Button>
            <Button
              onClick={() => {
                setShowPR(true);
              }}
              variant="primary"
            >
              {t('common.extract-pk-modal.reveal-key-button')}
            </Button>
          </>
        )
      }
    >
      {!showPK && (
        <div className={styles.section}>
          <Typography variant="bodyTiny" className={styles.noteText}>
            {t('common.extract-pk-modal.important-notice')}
          </Typography>
        </div>
      )}
      {showPK && (
        <div className={styles.section}>
          <CopyInput id="socialPK" textToCopy={pk || ''} />
        </div>
      )}
    </Dialog>
  );
};

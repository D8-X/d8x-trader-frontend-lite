import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Settings } from '@mui/icons-material';

import { Dialog } from 'components/dialog/Dialog';
import { LanguageSwitcher } from 'components/language-switcher/LanguageSwitcher';
import { Separator } from 'components/separator/Separator';
import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';

import { SettingsBlock } from '../settings-block/SettingsBlock';

import styles from './SettingsButton.module.scss';

export const SettingsButton = memo(() => {
  const { t } = useTranslation();

  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <TooltipMobile tooltip={t('common.settings.title')}>
        <Button onClick={() => setModalOpen(true)} className={styles.iconButton} variant="primary">
          <Settings className={styles.icon} />
        </Button>
      </TooltipMobile>

      <Dialog open={isModalOpen} className={styles.dialog} onClose={() => setModalOpen(false)}>
        <DialogTitle>{t('common.settings.title')}</DialogTitle>
        <Separator />
        <DialogContent className={styles.dialogContent}>
          <SettingsBlock />
        </DialogContent>
        <DialogContent className={styles.dialogContent}>
          <LanguageSwitcher />
        </DialogContent>
        <DialogActions className={styles.dialogAction}>
          <Button onClick={() => setModalOpen(false)} variant="secondary" size="small">
            {t('common.info-modal.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

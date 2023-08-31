import classNames from 'classnames';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { InfoOutlined } from '@mui/icons-material';
import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';

import styles from './InfoBlock.module.scss';

interface InfoBlockPropsI {
  title: string | ReactNode;
  content: string | ReactNode;
  classname?: string;
}

export const InfoBlock = ({ title, content, classname }: InfoBlockPropsI) => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <span className={styles.title}>{title}</span>{' '}
      <InfoOutlined onClick={() => setModalOpen(true)} className={classNames(styles.actionIcon, classname)} />
      <Dialog open={isModalOpen} className={styles.dialog}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent className={styles.dialogContent}>{content}</DialogContent>
        <DialogActions className={styles.dialogAction}>
          <Button onClick={() => setModalOpen(false)} variant="secondary" size="small">
            {t('common.info-modal.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

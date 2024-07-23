import classNames from 'classnames';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { InfoOutlined } from '@mui/icons-material';
import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';

import styles from './InfoLabelBlock.module.scss';

interface InfoBlockPropsI {
  titlePrefix?: string | ReactNode;
  title: string | ReactNode;
  content: string | ReactNode;
  labelClassname?: string;
  titleClassname?: string;
  iconHolderClassname?: string;
}

export const InfoLabelBlock = ({
  titlePrefix,
  title,
  content,
  labelClassname,
  titleClassname,
  iconHolderClassname,
}: InfoBlockPropsI) => {
  const { t } = useTranslation();

  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={classNames(styles.label, labelClassname)}>
        {titlePrefix && <span>{titlePrefix}</span>}
        <span className={classNames(styles.title, titleClassname)}>{title}</span>
        <span className={classNames(styles.iconHolder, iconHolderClassname)}>
          <InfoOutlined onClick={() => setModalOpen(true)} className={styles.actionIcon} />
        </span>
      </div>
      <Dialog open={isModalOpen} className={styles.dialog} onClose={() => setModalOpen(false)}>
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

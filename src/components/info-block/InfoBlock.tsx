import { useState } from 'react';

import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { ReactComponent as InfoIcon } from 'assets/icons/infoIcon.svg';
import { Dialog } from 'components/dialog/Dialog';

import styles from './InfoBlock.module.scss';

interface InfoBlockPropsI {
  title: string | JSX.Element;
  content: string | JSX.Element;
}

export const InfoBlock = ({ title, content }: InfoBlockPropsI) => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <InfoIcon onClick={() => setModalOpen(true)} className={styles.actionIcon} /> {title}
      <Dialog open={isModalOpen} className={styles.dialog}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent className={styles.dialogContent}>{content}</DialogContent>
        <DialogActions className={styles.dialogAction}>
          <Button onClick={() => setModalOpen(false)} variant="secondary" size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

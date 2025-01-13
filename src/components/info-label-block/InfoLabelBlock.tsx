import classnames from 'classnames';
import { type ReactNode, useCallback, useState } from 'react';

import { Info } from '@mui/icons-material';

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
  const [isModalOpen, setModalOpen] = useState(false);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <>
      <div className={classnames(styles.label, labelClassname)}>
        {titlePrefix && <span>{titlePrefix}</span>}
        <span className={classnames(styles.iconHolder, iconHolderClassname)}>
          <Info onClick={() => setModalOpen(true)} className={styles.actionIcon} />
        </span>
        <span className={classnames(styles.title, titleClassname)}>{title}</span>
      </div>

      <Dialog
        open={isModalOpen}
        onClose={handleClose}
        onCloseClick={handleClose}
        className={styles.dialog}
        dialogTitle={title}
      >
        {content}
      </Dialog>
    </>
  );
};

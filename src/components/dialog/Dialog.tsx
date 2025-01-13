import classnames from 'classnames';
import { ReactNode } from 'react';

import {
  Box,
  Button,
  CircularProgress,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
} from '@mui/material';

import CloseIcon from 'assets/icons/new/close.svg?react';
import { SeparatorTypeE } from 'components/separator/enums';
import { Separator } from 'components/separator/Separator';

import { ErrorDialog } from './ErrorDialog';

import styles from './Dialog.module.scss';

interface DialogPropsI extends DialogProps {
  dialogTitle: ReactNode;
  footerActions?: ReactNode;
  dialogContentClassName?: string;
  loading?: boolean;
  errorMsg?: string;
  onCloseClick?: () => void;
}

export const Dialog = ({
  open,
  loading,
  errorMsg,
  className,
  children,
  onCloseClick,
  dialogTitle,
  dialogContentClassName,
  footerActions,
  ...rest
}: DialogPropsI) => {
  return (
    <MuiDialog open={open} className={classnames(styles.dialog, className)} {...rest}>
      <DialogTitle>
        <span>{dialogTitle}</span>
        {onCloseClick && (
          <Button variant="outlined" className={styles.closeButton} onClick={onCloseClick}>
            <CloseIcon width="24px" height="24px" />
          </Button>
        )}
      </DialogTitle>
      <Separator separatorType={SeparatorTypeE.Modal} />
      {loading && (
        <Box className={styles.loaderWrapper}>
          <CircularProgress />
        </Box>
      )}
      {errorMsg && onCloseClick && <ErrorDialog errorMsg={errorMsg} onCloseClick={onCloseClick} />}
      {!loading && !errorMsg && (
        <>
          <DialogContent className={classnames(styles.dialogContent, dialogContentClassName)}>{children}</DialogContent>
          {footerActions && (
            <>
              <Separator separatorType={SeparatorTypeE.Modal} />
              <DialogActions className={styles.dialogAction}>{footerActions}</DialogActions>
            </>
          )}
        </>
      )}
    </MuiDialog>
  );
};

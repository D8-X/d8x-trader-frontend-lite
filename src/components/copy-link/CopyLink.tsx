import classnames from 'classnames';
import { memo, type ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { ContentCopy } from '@mui/icons-material';
import { Button } from '@mui/material';

import { ToastContent } from 'components/toast-content/ToastContent';
import { copyToClipboard } from 'utils/copyToClipboard';

import styles from './CopyLink.module.scss';

interface CopyLinkPropsI {
  textToCopy: string;
  elementToShow?: ReactNode;
  successMessage?: string;
  errorMessage?: string;
  classname?: string;
  iconClassname?: string;
  buttonVariant?: 'outlined' | 'primary' | 'secondary';
  noIcon?: boolean;
}

export const CopyLink = memo((props: CopyLinkPropsI) => {
  const { t } = useTranslation();

  const {
    textToCopy,
    elementToShow,
    successMessage = t('common.copied'),
    errorMessage = t('common.copy-error'),
    classname,
    iconClassname,
    buttonVariant = 'link',
    noIcon = false,
  } = props;

  const handleCopy = useCallback(async () => {
    const result = await copyToClipboard(textToCopy);
    if (result) {
      toast.success(<ToastContent title={successMessage} bodyLines={[]} />);
    } else {
      toast.error(<ToastContent title={errorMessage} bodyLines={[]} />);
    }
  }, [successMessage, errorMessage, textToCopy]);

  return (
    <Button onClick={handleCopy} className={classnames(styles.root, classname)} variant={buttonVariant}>
      <span>{elementToShow !== undefined ? elementToShow : textToCopy}</span>{' '}
      {!noIcon && <ContentCopy className={classnames(styles.icon, iconClassname)} />}
    </Button>
  );
});

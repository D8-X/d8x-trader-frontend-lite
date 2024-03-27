import classnames from 'classnames';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { ContentCopy } from '@mui/icons-material';
import { InputAdornment, OutlinedInput } from '@mui/material';

import { ToastContent } from 'components/toast-content/ToastContent';
import { copyToClipboard } from 'utils/copyToClipboard';

import styles from './CopyInput.module.scss';

interface CopyInputPropsI {
  id: string;
  textToCopy: string;
  successMessage?: string;
  errorMessage?: string;
  classname?: string;
  iconClassname?: string;
  disabled?: boolean;
}

export const CopyInput = memo((props: CopyInputPropsI) => {
  const { t } = useTranslation();

  const {
    id,
    textToCopy,
    successMessage = t('common.copied'),
    errorMessage = t('common.copy-error'),
    classname,
    iconClassname,
    disabled,
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
    <OutlinedInput
      id={id}
      className={classnames(styles.root, classname)}
      type="text"
      endAdornment={
        <InputAdornment position="end" className={styles.inputAdornment}>
          <ContentCopy className={classnames(styles.icon, iconClassname)} />
        </InputAdornment>
      }
      onClick={handleCopy}
      value={textToCopy}
      disabled={disabled}
    />
  );
});

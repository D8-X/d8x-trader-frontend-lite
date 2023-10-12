import classnames from 'classnames';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { Button, TableCell, TableRow, Typography } from '@mui/material';

import { ToastContent } from 'components/toast-content/ToastContent';
import { getRefLink } from 'helpers/getRefLink';
import type { ReferralTableDataI } from 'types/types';
import { copyToClipboard } from 'utils/copyToClipboard';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './ReferralCodesRow.module.scss';

interface ReferralCodesRowPropsI {
  fullWidth: number | undefined;
  data: ReferralTableDataI;
}

export const ReferralCodesRow = ({ data, fullWidth }: ReferralCodesRowPropsI) => {
  const { t } = useTranslation();

  const onCopyClick = async () => {
    const text = getRefLink(data.referralCode);
    const result = await copyToClipboard(text);
    if (result) {
      toast.success(
        <ToastContent
          title={t('pages.refer.referrer-tab.share-success')}
          bodyLines={[
            {
              label: '',
              value: (
                <a href={text} target="_blank" rel="noreferrer" className={styles.shareLink}>
                  {text}
                </a>
              ),
            },
          ]}
        />
      );
    } else {
      toast.error(<ToastContent title={t('pages.refer.referrer-tab.share-error')} bodyLines={[]} />);
    }
  };

  return (
    <TableRow className={styles.root}>
      <TableCell className={classnames(styles.bodyCell, styles.codeCell)}>
        <div
          className={styles.referralCode}
          style={{ width: fullWidth ? `${fullWidth * 0.25 + (data.isPartner ? 100 : 0)}px` : '100%' }}
          title={data.referralCode}
        >
          {data.referralCode}
        </div>
        {!data.isPartner && (
          <Button variant="primary" size="tableSmall" onClick={onCopyClick}>
            <Typography variant="bodyTiny">{t('pages.refer.referrer-tab.share')}</Typography>
          </Button>
        )}
      </TableCell>
      <TableCell align="right" className={styles.bodyCell}>
        {formatToCurrency(data.commission, '%', false, 2).replace(' ', '')}
      </TableCell>
      <TableCell align="right" className={styles.bodyCell}>
        {formatToCurrency(data.discount, '%', false, 2).replace(' ', '')}
      </TableCell>
    </TableRow>
  );
};

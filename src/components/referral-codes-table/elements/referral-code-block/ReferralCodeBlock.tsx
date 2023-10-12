import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getRefLink } from 'helpers/getRefLink';
import type { ReferralTableDataI, TableHeaderI } from 'types/types';
import { copyToClipboard } from 'utils/copyToClipboard';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './ReferralCodeBlock.module.scss';

interface ReferralCodeBlockPropsI {
  fullWidth: number | undefined;
  headers: TableHeaderI<ReferralTableDataI>[];
  data: ReferralTableDataI;
}

export const ReferralCodeBlock = ({ headers, data, fullWidth }: ReferralCodeBlockPropsI) => {
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
    <div className={styles.root}>
      <div className={styles.headerWrapper}>
        <div>
          <Typography variant="bodySmall" component="p">
            {t('pages.refer.referrer-tab.codes')}
          </Typography>
          <Typography
            variant="bodySmall"
            component="p"
            className={styles.code}
            style={{ width: fullWidth ? `${fullWidth - (data.isPartner ? 30 : 130)}px` : '100%' }}
            title={data.referralCode}
          >
            {data.referralCode}
          </Typography>
        </div>
        {!data.isPartner && (
          <div>
            <Button variant="primary" size="tableSmall" onClick={onCopyClick}>
              <Typography variant="bodyTiny">{t('pages.refer.referrer-tab.share')}</Typography>
            </Button>
          </div>
        )}
      </div>
      <div className={styles.dataWrapper}>
        <SidesRow
          leftSide={headers[1].label}
          rightSide={formatToCurrency(data.commission, '%', false, 2).replace(' ', '')}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[2].label}
          rightSide={formatToCurrency(data.discount, '%', false, 2).replace(' ', '')}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
      </div>
    </div>
  );
};

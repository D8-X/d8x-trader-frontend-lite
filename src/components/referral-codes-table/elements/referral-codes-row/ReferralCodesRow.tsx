import classnames from 'classnames';

import { TableCell, TableRow } from '@mui/material';

import type { ReferralTableDataI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './ReferralCodesRow.module.scss';

interface ReferralCodesRowPropsI {
  data: ReferralTableDataI;
}

export const ReferralCodesRow = ({ data }: ReferralCodesRowPropsI) => {
  // const { t } = useTranslation();

  // TODO: VOV: Is required for codes copy
  // const onCopyClick = async () => {
  //   const text = getRefLink(data.referralCode);
  //   const result = await copyToClipboard(text);
  //   if (result) {
  //     toast.success(
  //       <ToastContent
  //         title={t('pages.refer.referrer-tab.share-success')}
  //         bodyLines={[
  //           {
  //             label: '',
  //             value: (
  //               <a href={text} target="_blank" rel="noreferrer" className={styles.shareLink}>
  //                 {text}
  //               </a>
  //             ),
  //           },
  //         ]}
  //       />
  //     );
  //   } else {
  //     toast.error(<ToastContent title={t('pages.refer.referrer-tab.share-error')} bodyLines={[]} />);
  //   }
  // };

  return (
    <TableRow className={styles.root}>
      <TableCell className={classnames(styles.bodyCell, styles.codeCell)}>{data.referralCode}</TableCell>
      <TableCell align="right" className={styles.bodyCell}>
        {formatToCurrency(data.commission, '%', false, 2).replace(' ', '')}
      </TableCell>
      <TableCell align="right" className={styles.bodyCell}>
        {formatToCurrency(data.discount, '%', false, 2).replace(' ', '')}
      </TableCell>
    </TableRow>
  );
};

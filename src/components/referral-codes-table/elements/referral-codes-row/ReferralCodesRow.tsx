import classnames from 'classnames';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useChainId } from 'wagmi';

import { Button, TableCell, TableRow, Typography } from '@mui/material';

import { ToastContent } from 'components/toast-content/ToastContent';
import { getRefLink } from 'helpers/getRefLink';
import { useDialog } from 'hooks/useDialog';
import { AgencyReferrerDialog } from 'pages/refer-page/components/agency-referrer-dialog/AgencyReferrerDialog';
import { NormalReferrerDialog } from 'pages/refer-page/components/normal-referrer-dialog/NormalReferrerDialog';
import { ReferrerRoleE, useRebateRate } from 'pages/refer-page/hooks';
import { ReferralDialogActionE } from 'types/enums';
import type { ReferrerDataI } from 'types/types';
import { copyToClipboard } from 'utils/copyToClipboard';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './ReferralCodesRow.module.scss';

interface ReferralCodesRowPropsI {
  isAgency: boolean;
  data: ReferrerDataI;
}

export const ReferralCodesRow = ({ isAgency, data }: ReferralCodesRowPropsI) => {
  const { t } = useTranslation();

  const { dialogOpen, openDialog, closeDialog } = useDialog();

  const { address } = useAccount();
  const chainId = useChainId();

  const baseRebate = useRebateRate(chainId, address, data.agencyAddr ? ReferrerRoleE.AGENCY : ReferrerRoleE.NORMAL);

  const onCopyClick = async () => {
    const text = getRefLink(data.code);
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

  const absolutePercentages = useMemo(
    () => ({
      referrerRebatePerc: (data.referrerRebatePerc * baseRebate) / 100,
      traderRebatePerc: (data.traderRebatePerc * baseRebate) / 100,
      agencyRebatePerc: (data.agencyRebatePerc * baseRebate) / 100,
    }),
    [baseRebate, data.agencyRebatePerc, data.referrerRebatePerc, data.traderRebatePerc]
  );

  return (
    <>
      <TableRow className={styles.root}>
        <TableCell className={classnames(styles.bodyCell, styles.codeCell)}>{data.code}</TableCell>
        {!isAgency && (
          <TableCell align="right" className={classnames(styles.bodyCell, styles.buttonCell)}>
            <Button variant="primary" size="tableSmall" disabled={!data.code} onClick={onCopyClick}>
              <Typography variant="bodyTiny">{t('pages.refer.referrer-tab.share')}</Typography>
            </Button>
          </TableCell>
        )}
        <TableCell align="right" className={styles.bodyCell}>
          {formatToCurrency(absolutePercentages.referrerRebatePerc, '%', false, 2).replace(' ', '')}
        </TableCell>
        <TableCell align="right" className={styles.bodyCell}>
          {formatToCurrency(absolutePercentages.traderRebatePerc, '%', false, 2).replace(' ', '')}
        </TableCell>
        {isAgency && (
          <>
            <TableCell align="right" className={styles.bodyCell}>
              {formatToCurrency(absolutePercentages.agencyRebatePerc, '%', false, 2).replace(' ', '')}
            </TableCell>
            <TableCell align="center" className={classnames(styles.bodyCell, styles.buttonCell, styles.modifyCell)}>
              <Button variant="primary" onClick={openDialog} size="tableSmall">
                <Typography variant="bodyTiny">{t('pages.refer.referrer-tab.modify')}</Typography>
              </Button>
            </TableCell>
          </>
        )}
      </TableRow>
      {dialogOpen && isAgency && (
        <AgencyReferrerDialog
          code={data.code}
          referrerAddr={data.referrerAddr}
          type={ReferralDialogActionE.MODIFY}
          onClose={closeDialog}
          referrerRebatePercent={absolutePercentages.referrerRebatePerc}
          traderRebatePercent={absolutePercentages.traderRebatePerc}
          agencyRebatePercent={absolutePercentages.agencyRebatePerc}
        />
      )}
      {dialogOpen && !isAgency && (
        <NormalReferrerDialog
          code={data.code}
          type={ReferralDialogActionE.MODIFY}
          onClose={closeDialog}
          referrerRebatePercent={absolutePercentages.referrerRebatePerc}
          traderRebatePercent={absolutePercentages.traderRebatePerc}
        />
      )}
    </>
  );
};

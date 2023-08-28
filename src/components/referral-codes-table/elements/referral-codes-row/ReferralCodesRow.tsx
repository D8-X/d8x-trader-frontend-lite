import classnames from 'classnames';
import { useCallback, useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useChainId } from 'wagmi';

import { Button, TableCell, TableRow, Typography } from '@mui/material';

import { AgencyReferrerDialog } from 'pages/refer-page/components/agency-referrer-dialog/AgencyReferrerDialog';
import { NormalReferrerDialog } from 'pages/refer-page/components/normal-referrer-dialog/NormalReferrerDialog';
import { getRefLink } from 'helpers/getRefLink';
import { useDialog } from 'hooks/useDialog';
import { ReferrerRoleE, useRebateRate } from 'pages/refer-page/hooks';
import { formatToCurrency } from 'utils/formatToCurrency';
import type { ReferrerDataI } from 'types/types';
import { ToastContent } from 'components/toast-content/ToastContent';
import { ReferralDialogActionE } from 'types/enums';

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

  const handleCodeShare = useCallback(
    (link: string, result: boolean) => {
      if (result) {
        toast.success(
          <ToastContent
            title={t('pages.refer.referrer-tab.share-success')}
            bodyLines={[
              {
                label: '',
                value: (
                  <a href={link} target="_blank" rel="noreferrer">
                    {link}
                  </a>
                ),
              },
            ]}
          />
        );
      } else {
        toast.error(<ToastContent title={t('pages.refer.referrer-tab.share-error')} bodyLines={[]} />);
      }
    },
    [t]
  );

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
            <CopyToClipboard text={getRefLink(data.code)} onCopy={handleCodeShare}>
              <Button variant="primary" className={styles.modifyButton} size="tableSmall" disabled={!data.code}>
                <Typography variant="bodyTiny">{t('pages.refer.referrer-tab.share')}</Typography>
              </Button>
            </CopyToClipboard>
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
              <Button variant="primary" onClick={openDialog} className={styles.modifyButton} size="tableSmall">
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

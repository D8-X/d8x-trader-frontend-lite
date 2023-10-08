import { useAtom } from 'jotai';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';

import { Box, Button, Typography } from '@mui/material';

import { Separator } from 'components/separator/Separator';
import { ReferralCodesTable } from 'components/referral-codes-table/ReferralCodesTable';
import { useDialog } from 'hooks/useDialog';
import { commissionRateAtom, isAgencyAtom, referralCodesAtom } from 'store/refer.store';

import { NormalReferrerDialog } from '../normal-referrer-dialog/NormalReferrerDialog';
import { AgencyReferrerDialog } from '../agency-referrer-dialog/AgencyReferrerDialog';

import { ReferralDialogActionE } from 'types/enums';
import { ReferralTableDataI } from 'types/types';

import styles from './ReferralsBlock.module.scss';
import { useMemo } from 'react';

export const ReferralsBlock = () => {
  const { t } = useTranslation();

  const [isAgency] = useAtom(isAgencyAtom);
  const [commissionRate] = useAtom(commissionRateAtom);
  const [referralCodes] = useAtom(referralCodesAtom);

  const { address } = useAccount();

  const { dialogOpen, openDialog, closeDialog } = useDialog();

  const referralTableRows: ReferralTableDataI[] = useMemo(
    () =>
      referralCodes.map((referral) => ({
        referralCode: referral.referral,
        // TODO: VOV: Apply logic based on isAgency and code regexp
        isPartner: false,
        // TODO: VOV: Review logic
        commission: referral.PassOnPerc,
        discount: commissionRate - referral.PassOnPerc,
      })),
    [referralCodes, commissionRate]
  );

  return (
    <Box className={styles.root}>
      <Box className={styles.buttonContainer}>
        <Button onClick={openDialog} variant="primary" disabled={!address}>
          {t('pages.refer.referrer-tab.create')}
        </Button>
      </Box>
      <Separator className={styles.divider} />
      {address && referralCodes.length ? (
        <ReferralCodesTable isAgency={isAgency} codes={referralTableRows} />
      ) : (
        <>
          <Typography variant="bodySmall" component="p" className={styles.dataTitle}>
            {t('pages.refer.referrer-tab.codes')}
          </Typography>
          <Typography variant="bodyLarge" className={styles.dataValue}>
            {t('pages.refer.referrer-tab.na')}
          </Typography>
        </>
      )}
      {dialogOpen && !isAgency && <NormalReferrerDialog type={ReferralDialogActionE.CREATE} onClose={closeDialog} />}
      {dialogOpen && isAgency && <AgencyReferrerDialog type={ReferralDialogActionE.CREATE} onClose={closeDialog} />}
    </Box>
  );
};

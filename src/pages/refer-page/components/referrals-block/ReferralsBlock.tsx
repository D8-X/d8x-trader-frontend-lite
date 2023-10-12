import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { Separator } from 'components/separator/Separator';
import { ReferralCodesTable } from 'components/referral-codes-table/ReferralCodesTable';
import { useDialog } from 'hooks/useDialog';
import { commissionRateAtom, isAgencyAtom, referralCodesAtom } from 'store/refer.store';
import { type ReferralTableDataI } from 'types/types';
import { isValidAddress } from 'utils/isValidAddress';

import { AddPartnerDialog } from '../add-partner-dialog/AddPartnerDialog';
import { CreateReferrerCodeDialog } from '../create-referrer-code-dialog/CreateReferrerCodeDialog';

import styles from './ReferralsBlock.module.scss';

export const ReferralsBlock = () => {
  const { t } = useTranslation();

  const [isAgency] = useAtom(isAgencyAtom);
  const [commissionRate] = useAtom(commissionRateAtom);
  const [referralCodes] = useAtom(referralCodesAtom);

  const { address } = useAccount();

  const { dialogOpen: createDialogOpen, openDialog: openCreateDialog, closeDialog: closeCreateDialog } = useDialog();
  const { dialogOpen: addDialogOpen, openDialog: openAddDialog, closeDialog: closeAddDialog } = useDialog();

  const referralTableRows: ReferralTableDataI[] = useMemo(
    () =>
      referralCodes.map((referral) => {
        const discount = (referral.passOnPerc * commissionRate) / 100;
        let isPartner = false;
        if (isAgency) {
          isPartner = isValidAddress(referral.referral);
        }

        return {
          referralCode: referral.referral,
          isPartner,
          commission: commissionRate - discount,
          discount,
        };
      }),
    [referralCodes, commissionRate, isAgency]
  );

  return (
    <Box className={styles.root}>
      <Box className={styles.buttonsContainer}>
        {isAgency && (
          <Button onClick={openAddDialog} variant="primary" disabled={!address}>
            {t('pages.refer.referrer-tab.add-partner')}
          </Button>
        )}
        <Button onClick={openCreateDialog} variant="primary" disabled={!address}>
          {t('pages.refer.referrer-tab.create-code')}
        </Button>
      </Box>
      <Separator className={styles.divider} />
      {address && referralCodes.length ? (
        <ReferralCodesTable codes={referralTableRows} />
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
      <CreateReferrerCodeDialog isOpen={createDialogOpen} onClose={closeCreateDialog} />
      {isAgency && <AddPartnerDialog isOpen={addDialogOpen} onClose={closeAddDialog} />}
    </Box>
  );
};

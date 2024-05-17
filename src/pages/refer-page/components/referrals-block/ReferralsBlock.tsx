import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Button, Typography } from '@mui/material';

import { Separator } from 'components/separator/Separator';
import { ReferralCodesTable } from 'components/referral-codes-table/ReferralCodesTable';
import { useDialog } from 'hooks/useDialog';
import { commissionRateAtom, isAgencyAtom, referralCodesAtom } from 'store/refer.store';
import { type ReferralTableDataI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';
import { isValidAddress } from 'utils/isValidAddress';

import { AddPartnerDialog } from '../add-partner-dialog/AddPartnerDialog';
import { CreateReferrerCodeDialog } from '../create-referrer-code-dialog/CreateReferrerCodeDialog';

import styles from './ReferralsBlock.module.scss';

export const ReferralsBlock = () => {
  const { t } = useTranslation();

  const isAgency = useAtomValue(isAgencyAtom);
  const commissionRate = useAtomValue(commissionRateAtom);
  const referralCodes = useAtomValue(referralCodesAtom);

  const { address, chainId } = useAccount();

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
    <div className={styles.root}>
      <div className={styles.buttonsContainer}>
        {isAgency && (
          <Button onClick={openAddDialog} variant="primary" disabled={!address || !isEnabledChain(chainId)}>
            {t('pages.refer.referrer-tab.add-partner')}
          </Button>
        )}
        <Button onClick={openCreateDialog} variant="primary" disabled={!address || !isEnabledChain(chainId)}>
          {t('pages.refer.referrer-tab.create-code')}
        </Button>
      </div>
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
      <CreateReferrerCodeDialog isOpen={createDialogOpen && isEnabledChain(chainId)} onClose={closeCreateDialog} />
      {isAgency && <AddPartnerDialog isOpen={addDialogOpen && isEnabledChain(chainId)} onClose={closeAddDialog} />}
    </div>
  );
};

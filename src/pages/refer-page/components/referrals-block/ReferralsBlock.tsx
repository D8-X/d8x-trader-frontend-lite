import { useAtom } from 'jotai';
import { useAccount } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { Separator } from 'components/separator/Separator';
import { ReferralCodesTable } from 'components/referral-codes-table/ReferralCodesTable';
import { WalletConnectButton } from 'components/wallet-connect-button/WalletConnectButton';
import { useDialog } from 'hooks/useDialog';
import { isAgencyAtom, referralCodeAtom } from 'store/refer.store';

import { NormalReferrerDialog } from '../normal-referrer-dialog/NormalReferrerDialog';
import { AgencyReferrerDialog } from '../agency-referrer-dialog/AgencyReferrerDialog';

import { ReferralDialogActionE } from 'types/enums';

import styles from './ReferralsBlock.module.scss';

export const ReferralsBlock = () => {
  const [isAgency] = useAtom(isAgencyAtom);
  const [referralCode] = useAtom(referralCodeAtom);

  const { address } = useAccount();

  const { dialogOpen, openDialog, closeDialog } = useDialog();

  return (
    <Box className={styles.root}>
      <Box className={styles.buttonContainer}>
        {address ? (
          <Button onClick={openDialog} variant="primary" className={styles.enterCodeButton}>
            Create code
          </Button>
        ) : (
          <WalletConnectButton />
        )}
      </Box>
      <Separator className={styles.divider} />
      {address && referralCode && referralCode.agency && referralCode.referrer ? (
        <ReferralCodesTable isAgency={isAgency} codes={isAgency ? referralCode.agency : referralCode.referrer} />
      ) : (
        <>
          <Typography variant="bodySmall" component="p" className={styles.dataTitle}>
            Your codes
          </Typography>
          <Typography variant="bodyLarge" className={styles.dataValue}>
            N/A
          </Typography>
        </>
      )}
      {dialogOpen && !isAgency && <NormalReferrerDialog type={ReferralDialogActionE.CREATE} onClose={closeDialog} />}
      {dialogOpen && isAgency && <AgencyReferrerDialog type={ReferralDialogActionE.CREATE} onClose={closeDialog} />}
    </Box>
  );
};

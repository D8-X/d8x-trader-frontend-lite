import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';
import { Separator } from 'components/separator/Separator';

import { EnterCodeDialog } from '../enter-code-dialog/EnterCodeDialog';

import styles from './ReferralCodeBlock.module.scss';

interface ReferralCodeBlockPropsI {
  referralCode: string | null;
  traderRebatePercentage: number;
  onCodeApplySuccess: () => void;
}

export const ReferralCodeBlock = ({
  referralCode,
  traderRebatePercentage,
  onCodeApplySuccess,
}: ReferralCodeBlockPropsI) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { address } = useAccount();

  return (
    <Box className={styles.root}>
      <Box className={styles.topSection}>
        <Box>
          <Typography variant="bodySmall" component="p" className={styles.dataTitle}>
            {t('pages.refer.trader-tab.your-rebate-rate')}
          </Typography>
          <Typography variant="bodyLarge" className={styles.dataValue}>
            {address && traderRebatePercentage ? `${traderRebatePercentage.toFixed(2)}%` : 'N/A'}
          </Typography>
        </Box>
        {address && referralCode === '' ? (
          <Button variant="primary" onClick={() => setDialogOpen(true)} className={styles.newCodeButton}>
            {t('pages.refer.trader-tab.enter-new-code')}
          </Button>
        ) : null}
      </Box>
      <Separator className={styles.divider} />
      <Typography variant="bodySmall" component="p" className={styles.dataTitle}>
        {t('pages.refer.trader-tab.your-active-code')}
      </Typography>
      <Typography variant="bodyLarge" className={styles.dataValue}>
        {address && referralCode ? referralCode : 'N/A'}
      </Typography>
      {dialogOpen && <EnterCodeDialog onClose={() => setDialogOpen(false)} onCodeApplySuccess={onCodeApplySuccess} />}
    </Box>
  );
};

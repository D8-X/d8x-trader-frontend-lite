import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Box, Button, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { ToastContent } from 'components/toast-content/ToastContent';
import { postUseReferralCode } from 'network/referral';
import { useCodeInput } from 'pages/refer-page/hooks';

import { CodeStateE } from '../../enums';

import styles from './EnterCodeDialog.module.scss';

interface EnterCodeDialogPropsI {
  isOpen: boolean;
  onClose: () => void;
  onCodeApplySuccess: () => void;
}

export const EnterCodeDialog = ({ isOpen, onClose, onCodeApplySuccess }: EnterCodeDialogPropsI) => {
  const { t } = useTranslation();

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const { codeInputValue, setCodeInputValue, handleCodeChange, codeState } = useCodeInput(chainId);

  const inputDisabled = codeState !== CodeStateE.CODE_TAKEN;

  const handleUseCode = () => {
    if (!address || !walletClient) {
      return;
    }
    postUseReferralCode(chainId, address, codeInputValue, walletClient, onClose)
      .then(() => {
        toast.success(<ToastContent title={t('pages.refer.toast.success-apply')} bodyLines={[]} />);
        onCodeApplySuccess();
        setCodeInputValue('');
      })
      .catch((error) => {
        console.error(error);
        toast.error(<ToastContent title={error.error || error.message} bodyLines={[]} />);
      });
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Box className={styles.dialogRoot}>
        <Typography variant="h5" className={styles.title}>
          {t('pages.refer.trader-tab.title3')}
        </Typography>
        <OutlinedInput
          placeholder={t('pages.refer.trader-tab.enter-code')}
          value={codeInputValue}
          onChange={handleCodeChange}
          className={styles.input}
        />
        <Typography variant="bodyTiny" className={styles.infoText}>
          {t('pages.refer.trader-tab.instructions')}
        </Typography>
        <Box className={styles.actionButtonsContainer}>
          <Button variant="secondary" className={styles.cancelButton} onClick={onClose}>
            {t('pages.refer.trader-tab.cancel')}
          </Button>
          <Button variant="primary" disabled={inputDisabled} onClick={handleUseCode}>
            {codeState === CodeStateE.DEFAULT && t('pages.refer.trader-tab.enter-a-code')}
            {codeState === CodeStateE.CODE_AVAILABLE && t('pages.refer.trader-tab.code-not-found')}
            {codeState === CodeStateE.CODE_TAKEN && t('pages.refer.trader-tab.use-code')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

import { toast } from 'react-toastify';
import { useAccount, useChainId, useSigner } from 'wagmi';

import { Box, Button, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { ToastContent } from 'components/toast-content/ToastContent';

import { postUseReferralCode } from 'network/referral';

import { CodeStateE, useCodeInput } from 'pages/refer-page/hooks';

import styles from './EnterCodeDialog.module.scss';

interface EnterCodeDialogPropsI {
  onClose: () => void;
  onCodeApplySuccess: () => void;
}

export const EnterCodeDialog = ({ onClose, onCodeApplySuccess }: EnterCodeDialogPropsI) => {
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const chainId = useChainId();

  const { codeInputValue, handleCodeChange, codeState } = useCodeInput(chainId);

  const inputDisabled = codeState !== CodeStateE.CODE_TAKEN;

  const handleUseCode = async () => {
    if (!address || !signer) {
      return;
    }
    try {
      await postUseReferralCode(chainId, address, codeInputValue, signer, onClose);
      toast.success(<ToastContent title="Code applied successfully" bodyLines={[]} />);
      onCodeApplySuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <Box className={styles.dialogRoot}>
        <Typography variant="h5" className={styles.title}>
          Enter Referral Code
        </Typography>
        <OutlinedInput
          placeholder="Enter a code"
          value={codeInputValue}
          onChange={handleCodeChange}
          className={styles.input}
        />
        <Typography variant="bodyTiny" className={styles.infoText}>
          Only uppercase characters, numbers, underscores ( _ ) and hyphens (-) are allowed.
        </Typography>
        <Box className={styles.actionButtonsContainer}>
          <Button variant="secondary" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={inputDisabled} onClick={handleUseCode} className={styles.enterCodeButton}>
            {codeState === CodeStateE.DEFAULT && 'Enter code'}
            {codeState === CodeStateE.CODE_AVAILABLE && 'Code not found'}
            {codeState === CodeStateE.CODE_TAKEN && 'Use code'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

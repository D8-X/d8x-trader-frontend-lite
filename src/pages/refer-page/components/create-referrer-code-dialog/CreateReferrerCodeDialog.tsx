import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Box, Button, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { postUpsertCode } from 'network/referral';
import { useCodeInput } from 'pages/refer-page/hooks';
import { replaceSymbols } from 'utils/replaceInvalidSymbols';
import { commissionRateAtom, referralCodesRefetchHandlerRefAtom } from 'store/refer.store';

import { CodeStateE } from '../../enums';

import styles from './CreateReferrerCodeDialog.module.scss';

interface CreateReferrerCodeDialogPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateReferrerCodeDialog = ({ isOpen, onClose }: CreateReferrerCodeDialogPropsI) => {
  const { t } = useTranslation();

  const [kickbackRateInputValue, setKickbackRateInputValue] = useState('0');

  const [referralCodesRefetchHandler] = useAtom(referralCodesRefetchHandlerRefAtom);
  const [commissionRate] = useAtom(commissionRateAtom);

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const { codeInputValue, handleCodeChange, codeState } = useCodeInput(chainId);
  const codeInputDisabled = codeState !== CodeStateE.CODE_AVAILABLE;

  useEffect(() => {
    const kickbackRate = 0.25 * commissionRate;
    setKickbackRateInputValue(kickbackRate.toFixed(2));
  }, [commissionRate]);

  const sidesRowValues = useMemo(() => {
    const traderRate = +kickbackRateInputValue;
    const userRate = commissionRate > 0 ? commissionRate - traderRate : 0;

    return { userRate: userRate.toFixed(2), traderRate: traderRate.toFixed(2) };
  }, [commissionRate, kickbackRateInputValue]);

  const handleKickbackRateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    const filteredValue = replaceSymbols(value);

    if (+filteredValue > commissionRate) {
      setKickbackRateInputValue(commissionRate.toFixed(2));
      return;
    }
    setKickbackRateInputValue(filteredValue);
  };

  const handleUpsertCode = async () => {
    if (!address || !walletClient) {
      return;
    }

    const { userRate, traderRate } = sidesRowValues;

    const rateSum = Number(userRate) + Number(traderRate);

    const referrerRebatePercent = (100 * Number(userRate)) / rateSum;
    const traderRebatePercent = (100 * Number(traderRate)) / rateSum;

    await postUpsertCode(
      chainId,
      address,
      codeInputValue,
      referrerRebatePercent,
      traderRebatePercent,
      walletClient,
      onClose
    );
    toast.success(<ToastContent title={t('pages.refer.toast.success-create')} bodyLines={[]} />);
    referralCodesRefetchHandler.handleRefresh();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Box className={styles.dialogRoot}>
        <Typography variant="h5" className={styles.title}>
          {t('pages.refer.manage-code.title-create')}
        </Typography>
        <Box className={styles.baseRebateContainer}>
          <Typography variant="bodyMedium" fontWeight={600}>
            {t('pages.refer.manage-code.commission-rate')}
          </Typography>
          <Typography variant="bodyMedium" fontWeight={600}>
            {commissionRate}%
          </Typography>
        </Box>
        <Box className={styles.paddedContainer}>
          <SidesRow
            leftSide={t('pages.refer.manage-code.you-receive')}
            rightSide={`${sidesRowValues.userRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          <SidesRow
            leftSide={t('pages.refer.manage-code.trader-receives')}
            rightSide={`${sidesRowValues.traderRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
        </Box>
        <div className={styles.divider} />
        <Box className={styles.kickbackRateInputContainer}>
          <Typography variant="bodySmall">{t('pages.refer.manage-code.trader-kickback')}</Typography>
          <OutlinedInput
            type="text"
            value={kickbackRateInputValue}
            inputProps={{ min: 0, max: commissionRate }}
            onChange={handleKickbackRateChange}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </Box>
        <div className={styles.divider} />
        <Box className={styles.codeInputContainer}>
          <OutlinedInput
            placeholder={t('pages.refer.trader-tab.enter-a-code')}
            value={codeInputValue}
            onChange={handleCodeChange}
            className={styles.codeInput}
          />
        </Box>
        <Typography variant="bodyTiny" component="p" className={styles.infoText}>
          {t('pages.refer.manage-code.instructions')}
        </Typography>
        <Box className={styles.dialogActionsContainer}>
          <Button variant="secondary" onClick={onClose}>
            {t('pages.refer.manage-code.cancel')}
          </Button>
          <Button variant="primary" disabled={codeInputDisabled} onClick={handleUpsertCode}>
            {codeState === CodeStateE.DEFAULT && t('pages.refer.manage-code.enter-code')}
            {codeState === CodeStateE.CODE_TAKEN && t('pages.refer.manage-code.code-taken')}
            {codeState === CodeStateE.CODE_AVAILABLE && t('pages.refer.manage-code.create-code')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

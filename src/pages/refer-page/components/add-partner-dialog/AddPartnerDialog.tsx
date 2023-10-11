import { useAtom } from 'jotai';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Box, Button, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { postRefer } from 'network/referral';
import { isValidAddress } from 'utils/isValidAddress';
import { replaceSymbols } from 'utils/replaceInvalidSymbols';
import { commissionRateAtom, referralCodesRefetchHandlerRefAtom } from 'store/refer.store';

import styles from './AddPartnerDialog.module.scss';

interface AddPartnerDialogPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPartnerDialog = ({ isOpen, onClose }: AddPartnerDialogPropsI) => {
  const { t } = useTranslation();

  const [partnerRateInputValue, setPartnerRateInputValue] = useState('0');
  const [partnerAddressInputValue, setPartnerAddressInputValue] = useState('');

  const [referralCodesRefetchHandler] = useAtom(referralCodesRefetchHandlerRefAtom);
  const [commissionRate] = useAtom(commissionRateAtom);

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const partnerAddressInputTouchedRef = useRef(false);

  useEffect(() => {
    const partnerKickbackRate = 0.25 * commissionRate;
    setPartnerRateInputValue(partnerKickbackRate.toFixed(2));
  }, [commissionRate]);

  const sidesRowValues = useMemo(() => {
    const partnerRate = +partnerRateInputValue;
    const userRate = commissionRate > 0 ? commissionRate - partnerRate : 0;

    return { userRate: userRate.toFixed(2), partnerRate: partnerRate.toFixed(2) };
  }, [commissionRate, partnerRateInputValue]);

  const handleKickbackRateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    const filteredValue = replaceSymbols(value);

    if (+filteredValue > commissionRate) {
      setPartnerRateInputValue(commissionRate.toFixed(2));
      return;
    }
    setPartnerRateInputValue(filteredValue);
  };

  const handlePartnerAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!partnerAddressInputTouchedRef.current) {
      partnerAddressInputTouchedRef.current = true;
    }

    const { value } = event.target;
    setPartnerAddressInputValue(value);
  };

  const isAddressValid = useMemo(() => {
    if (partnerAddressInputValue.length > 42) {
      return false;
    }
    return isValidAddress(partnerAddressInputValue);
  }, [partnerAddressInputValue]);

  const handleReferPost = async () => {
    if (!address || !walletClient || !isAddressValid) {
      return;
    }

    const { userRate, partnerRate } = sidesRowValues;

    const rateSum = Number(userRate) + Number(partnerRate);

    const referrerRebatePercent = (100 * Number(userRate)) / rateSum;
    const partnerRebatePercent = (100 * Number(partnerRate)) / rateSum;

    await postRefer(
      chainId,
      partnerAddressInputValue,
      referrerRebatePercent,
      partnerRebatePercent,
      walletClient,
      onClose
    );
    toast.success(<ToastContent title={t('pages.refer.toast.success-add-partner')} bodyLines={[]} />);
    referralCodesRefetchHandler.handleRefresh();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Box className={styles.dialogRoot}>
        <Typography variant="h5" className={styles.title}>
          {t('pages.refer.manage-code.title-add')}
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
            leftSide={t('pages.refer.manage-code.you')}
            rightSide={`${sidesRowValues.userRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          <SidesRow
            leftSide={t('pages.refer.manage-code.partner')}
            rightSide={`${sidesRowValues.partnerRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
        </Box>
        <div className={styles.divider} />
        <Box className={styles.referrerKickbackInputContainer}>
          <Typography variant="bodySmall">{t('pages.refer.manage-code.partner-kickback')}</Typography>
          <OutlinedInput
            type="text"
            inputProps={{ min: 0, max: commissionRate }}
            value={partnerRateInputValue}
            onChange={handleKickbackRateChange}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </Box>
        <div className={styles.divider} />
        <Box className={styles.codeInputContainer}>
          <Typography variant="bodySmall" className={styles.codeInputLabel} component="p">
            {t('pages.refer.manage-code.partner-address')}
          </Typography>
          <OutlinedInput
            placeholder={t('pages.refer.manage-code.enter-addr')}
            value={partnerAddressInputValue}
            onChange={handlePartnerAddressChange}
            className={styles.codeInput}
          />
          {!isAddressValid && partnerAddressInputTouchedRef.current && (
            <Typography variant="bodySmall" color="red" component="p" mt={1}>
              {t('pages.refer.manage-code.error')}
            </Typography>
          )}
        </Box>
        <Box className={styles.dialogActionsContainer}>
          <Button variant="secondary" onClick={onClose} className={styles.cancelButton}>
            {t('pages.refer.manage-code.cancel')}
          </Button>
          <Button variant="primary" disabled={!isAddressValid} onClick={handleReferPost}>
            {t('pages.refer.manage-code.add-partner')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

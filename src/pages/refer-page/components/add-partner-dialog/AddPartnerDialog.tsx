import { useAtom } from 'jotai';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useWalletClient } from 'wagmi';

import { Button, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { postRefer } from 'network/referral';
import { commissionRateAtom, referralCodesRefetchHandlerRefAtom } from 'store/refer.store';
import { isEnabledChain } from 'utils/isEnabledChain';
import { isValidAddress } from 'utils/isValidAddress';
import { replaceSymbols } from 'utils/replaceInvalidSymbols';

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
  const { address, chainId } = useAccount();

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

  const handleReferPost = () => {
    if (!address || !walletClient || !isAddressValid || !isEnabledChain(chainId)) {
      return;
    }

    const { userRate, partnerRate } = sidesRowValues;

    postRefer(chainId, partnerAddressInputValue, Number(userRate), Number(partnerRate), walletClient, onClose)
      .then(() => {
        toast.success(<ToastContent title={t('pages.refer.toast.success-add-partner')} bodyLines={[]} />);
      })
      .catch((error) => {
        console.error(error);
        toast.error(<ToastContent title={error.error || error.message} bodyLines={[]} />);
      })
      .finally(() => {
        referralCodesRefetchHandler.handleRefresh();
      });
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className={styles.dialogRoot}>
        <Typography variant="h5" className={styles.title}>
          {t('pages.refer.manage-code.title-add')}
        </Typography>
        <div className={styles.baseRebateContainer}>
          <Typography variant="bodySmall" fontWeight={600}>
            {t('pages.refer.manage-code.commission-rate')}
          </Typography>
          <Typography variant="bodySmall" fontWeight={600}>
            {commissionRate}%
          </Typography>
        </div>
        <div className={styles.paddedContainer}>
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
        </div>
        <div className={styles.divider} />
        <div className={styles.referrerKickbackInputContainer}>
          <Typography variant="bodySmall">{t('pages.refer.manage-code.partner-kickback')}</Typography>
          <OutlinedInput
            type="text"
            inputProps={{ min: 0, max: commissionRate }}
            value={partnerRateInputValue}
            onChange={handleKickbackRateChange}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.codeInputContainer}>
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
        </div>
        <div className={styles.dialogActionsContainer}>
          <Button variant="secondary" onClick={onClose} className={styles.cancelButton}>
            {t('pages.refer.manage-code.cancel')}
          </Button>
          <Button variant="primary" disabled={!isAddressValid || !isEnabledChain(chainId)} onClick={handleReferPost}>
            {t('pages.refer.manage-code.add-partner')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

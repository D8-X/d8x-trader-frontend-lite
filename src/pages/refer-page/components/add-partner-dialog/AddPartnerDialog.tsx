import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAtom } from 'jotai';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Box, Button, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useCodeInput } from 'pages/refer-page/hooks';
import { postUpsertCode } from 'network/referral';
import { isValidAddress } from 'utils/isValidAddress';
import { replaceSymbols } from 'utils/replaceInvalidSymbols';
import { commissionRateAtom, referralCodesRefetchHandlerRefAtom } from 'store/refer.store';

import { CodeStateE } from '../../enums';

import styles from './AddPartnerDialog.module.scss';

enum KickbackRateTypeE {
  REFERRER,
  TRADER,
}

interface AddPartnerDialogPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPartnerDialog = ({ isOpen, onClose }: AddPartnerDialogPropsI) => {
  const { t } = useTranslation();

  const [referrersKickbackRate, setReferrersKickbackRate] = useState('0');
  const [tradersKickbackRate, setTradersKickbackRate] = useState('0');

  const [referralCodesRefetchHandler] = useAtom(referralCodesRefetchHandlerRefAtom);
  const [commissionRate] = useAtom(commissionRateAtom);

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const { codeInputValue, handleCodeChange, codeState } = useCodeInput(chainId);
  const codeInputDisabled = codeState !== CodeStateE.CODE_AVAILABLE;

  useEffect(() => {
    const referrerKickbackRate = 0.33 * commissionRate;
    const traderKickbackRate = 0.33 * commissionRate;
    setReferrersKickbackRate(referrerKickbackRate.toFixed(2));
    setTradersKickbackRate(traderKickbackRate.toFixed(2));
  }, [commissionRate]);

  const [referrerAddressInputValue, setReferrerAddressInputValue] = useState('');

  const referrerAddressInputTouchedRef = useRef(false);

  const sidesRowValues = useMemo(() => {
    const agencyRate = commissionRate - Number(referrersKickbackRate) - Number(tradersKickbackRate);
    const referrerRate = commissionRate - agencyRate - Number(tradersKickbackRate);
    const traderRate = commissionRate - agencyRate - Number(referrersKickbackRate);

    return {
      agencyRate: agencyRate.toFixed(2),
      referrerRate: referrerRate.toFixed(2),
      traderRate: traderRate.toFixed(2),
    };
  }, [commissionRate, referrersKickbackRate, tradersKickbackRate]);

  const handleKickbackRateChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    type: KickbackRateTypeE
  ) => {
    const { value } = event.target;
    const filteredValue = replaceSymbols(value);

    if (type === KickbackRateTypeE.REFERRER) {
      if (+filteredValue + Number(tradersKickbackRate) > commissionRate) {
        setReferrersKickbackRate(commissionRate.toFixed(2));
        setTradersKickbackRate('0');
        return;
      }
      setReferrersKickbackRate(filteredValue);
      return;
    }

    if (type === KickbackRateTypeE.TRADER) {
      if (+filteredValue + Number(referrersKickbackRate) > commissionRate) {
        setTradersKickbackRate(commissionRate.toFixed(2));
        setReferrersKickbackRate('0');
        return;
      }
      setTradersKickbackRate(filteredValue);
      return;
    }
  };

  const handleReferrerAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!referrerAddressInputTouchedRef.current) {
      referrerAddressInputTouchedRef.current = true;
    }

    const { value } = event.target;
    setReferrerAddressInputValue(value);
  };

  const isAddressValid = useMemo(() => {
    if (referrerAddressInputValue.length > 42) {
      return false;
    }
    return isValidAddress(referrerAddressInputValue);
  }, [referrerAddressInputValue]);

  const handleUpsertCode = async () => {
    if (!address || !walletClient) {
      return;
    }
    const { agencyRate, referrerRate, traderRate } = sidesRowValues;

    const rateSum = Number(agencyRate) + Number(referrerRate) + Number(traderRate);

    const traderRebatePercent = (100 * Number(traderRate)) / rateSum;

    // const agencyRebatePercent = (100 * Number(agencyRate)) / rateSum;

    const referrerRebatePercent = (100 * Number(referrerRate)) / rateSum;

    // TODO: MJO: Check - What are the possible return types? What if `type` === 'error'?
    await postUpsertCode(
      chainId,
      referrerAddressInputValue,
      codeInputValue,
      traderRebatePercent,
      referrerRebatePercent,
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
            leftSide={t('pages.refer.manage-code.agency')}
            rightSide={`${sidesRowValues.agencyRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          <SidesRow
            leftSide={t('pages.refer.manage-code.referrer')}
            rightSide={`${sidesRowValues.referrerRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          <SidesRow
            leftSide={t('pages.refer.manage-code.trader')}
            rightSide={`${sidesRowValues.traderRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
        </Box>
        <div className={styles.divider} />
        <Box className={styles.referrerKickbackInputContainer}>
          <Typography variant="bodySmall">{t('pages.refer.manage-code.referrer-kickback')}</Typography>
          <OutlinedInput
            type="text"
            inputProps={{ min: 0, max: commissionRate }}
            value={referrersKickbackRate}
            onChange={(event) => handleKickbackRateChange(event, KickbackRateTypeE.REFERRER)}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </Box>
        <Box className={styles.traderKickbackInputContainer}>
          <Typography variant="bodySmall">{t('pages.refer.manage-code.trader-kickback')}</Typography>
          <OutlinedInput
            type="text"
            inputProps={{ min: 0, max: commissionRate }}
            value={tradersKickbackRate}
            onChange={(event) => handleKickbackRateChange(event, KickbackRateTypeE.TRADER)}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </Box>
        <div className={styles.divider} />
        <Box className={styles.codeInputContainer}>
          <Typography variant="bodySmall" className={styles.codeInputLabel} component="p">
            {t('pages.refer.manage-code.referrer-addr')}
          </Typography>
          <OutlinedInput
            placeholder={t('pages.refer.manage-code.enter-addr')}
            value={referrerAddressInputValue}
            onChange={handleReferrerAddressChange}
            className={styles.codeInput}
          />
          {!isAddressValid && referrerAddressInputTouchedRef.current && (
            <Typography variant="bodySmall" color="red" component="p" mt={1}>
              {t('pages.refer.manage-code.error')}
            </Typography>
          )}
        </Box>
        <div className={styles.divider} />
        <Box className={styles.codeInputContainer}>
          <OutlinedInput
            placeholder="Enter a code"
            value={codeInputValue}
            onChange={handleCodeChange}
            className={styles.codeInput}
          />
        </Box>
        <Typography variant="bodyTiny" component="p" className={styles.infoText}>
          {t('pages.refer.manage-code.instructions')}
        </Typography>
        <Box className={styles.dialogActionsContainer}>
          <Button variant="secondary" onClick={onClose} className={styles.cancelButton}>
            {t('pages.refer.manage-code.cancel')}
          </Button>
          <Button variant="primary" disabled={codeInputDisabled || !isAddressValid} onClick={handleUpsertCode}>
            {codeState === CodeStateE.DEFAULT && t('pages.refer.manage-code.enter-code')}
            {codeState === CodeStateE.CODE_TAKEN && t('pages.refer.manage-code.code-taken')}
            {codeState === CodeStateE.CODE_AVAILABLE && t('pages.refer.manage-code.create-code')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

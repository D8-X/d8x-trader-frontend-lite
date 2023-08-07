import { type ChangeEvent, useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAtom } from 'jotai';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Box, Button, Checkbox, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';

import { CodeStateE, ReferrerRoleE, useCodeInput, useRebateRate } from 'pages/refer-page/hooks';

import { postUpsertReferralCode } from 'network/referral';

import { isValidAddress } from 'utils/isValidAddress';
import { replaceSymbols } from 'utils/replaceInvalidSymbols';

import { referralCodesRefetchHandlerRefAtom } from 'store/refer.store';

import { ReferralDialogActionE } from 'types/enums';

import styles from './AgencyReferrerDialog.module.scss';

enum KickbackRateTypeE {
  REFERRER,
  TRADER,
}

interface NormalReferrerDialogCreatePropsI {
  type: ReferralDialogActionE.CREATE;
  onClose: () => void;
}

interface NormalReferrerDialogModifyPropsI {
  type: ReferralDialogActionE.MODIFY;
  code: string;
  referrerAddr: string;
  onClose: () => void;
  referrerRebatePercent: number;
  traderRebatePercent: number;
  agencyRebatePercent: number;
}

type UpdatedAgencyReferrerDialogPropsT = NormalReferrerDialogCreatePropsI | NormalReferrerDialogModifyPropsI;

export const AgencyReferrerDialog = (props: UpdatedAgencyReferrerDialogPropsT) => {
  const [referralCodesRefetchHandler] = useAtom(referralCodesRefetchHandlerRefAtom);

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const { codeInputValue, handleCodeChange, codeState } = useCodeInput(chainId);
  const codeInputDisabled = codeState !== CodeStateE.CODE_AVAILABLE;

  const baseRebate = useRebateRate(chainId, address, ReferrerRoleE.AGENCY);

  const [referrersKickbackRate, setReferrersKickbackRate] = useState('0');
  const [tradersKickbackRate, setTradersKickbackRate] = useState('0');

  useEffect(() => {
    let traderKickbackRate, referrerKickbackRate;
    if (props.type === ReferralDialogActionE.MODIFY) {
      referrerKickbackRate = props.referrerRebatePercent;
      traderKickbackRate = props.traderRebatePercent;
    } else {
      referrerKickbackRate = 0.33 * baseRebate;
      traderKickbackRate = 0.33 * baseRebate;
    }
    setReferrersKickbackRate(referrerKickbackRate.toFixed(2));
    setTradersKickbackRate(traderKickbackRate.toFixed(2));
  }, [baseRebate, props]);

  const [referrerAddressInputValue, setReferrerAddressInputValue] = useState(
    props.type === ReferralDialogActionE.CREATE ? '' : props.referrerAddr
  );

  const referrerAddressInputTouchedRef = useRef(false);

  const [boxChecked, setBoxChecked] = useState(false);

  const sidesRowValues = useMemo(() => {
    const agencyRate = baseRebate - Number(referrersKickbackRate) - Number(tradersKickbackRate);
    const referrerRate = baseRebate - agencyRate - Number(tradersKickbackRate);
    const traderRate = baseRebate - agencyRate - Number(referrersKickbackRate);

    return {
      agencyRate: agencyRate.toFixed(2),
      referrerRate: referrerRate.toFixed(2),
      traderRate: traderRate.toFixed(2),
    };
  }, [baseRebate, referrersKickbackRate, tradersKickbackRate]);

  const handleKickbackRateChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    type: KickbackRateTypeE
  ) => {
    const { value } = event.target;
    const filteredValue = replaceSymbols(value);

    if (type === KickbackRateTypeE.REFERRER) {
      if (+filteredValue + Number(tradersKickbackRate) > baseRebate) {
        setReferrersKickbackRate(baseRebate.toFixed(2));
        setTradersKickbackRate('0');
        return;
      }
      setReferrersKickbackRate(filteredValue);
      return;
    }

    if (type === KickbackRateTypeE.TRADER) {
      if (+filteredValue + Number(referrersKickbackRate) > baseRebate) {
        setTradersKickbackRate(baseRebate.toFixed(2));
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

    const agencyRebatePercent = (100 * Number(agencyRate)) / rateSum;

    const referrerRebatePercent = (100 * Number(referrerRate)) / rateSum;

    const code = props.type === ReferralDialogActionE.MODIFY ? props.code : codeInputValue;

    // TODO: MJO: Check - What are the possible return types? What if `type` === 'error'?
    await postUpsertReferralCode(
      chainId,
      referrerAddressInputValue,
      address,
      code,
      traderRebatePercent,
      agencyRebatePercent,
      referrerRebatePercent,
      walletClient,
      props.onClose
    );
    toast.success(
      <ToastContent
        title={`Code ${props.type === ReferralDialogActionE.CREATE ? 'created' : 'modified'} successfully`}
        bodyLines={[]}
      />
    );
    referralCodesRefetchHandler.handleRefresh();
  };

  return (
    <Dialog open={true} onClose={props.onClose}>
      <Box className={styles.dialogRoot}>
        <Typography variant="h5" className={styles.title}>
          {props.type === ReferralDialogActionE.CREATE ? 'Create' : 'Modify'} Referral Code
        </Typography>
        <Box className={styles.baseRebateContainer}>
          <Typography variant="bodyMedium" fontWeight={600}>
            Your Base Rebate Rate:
          </Typography>
          <Typography variant="bodyMedium" fontWeight={600}>
            {baseRebate}%
          </Typography>
        </Box>
        <Box className={styles.paddedContainer}>
          <SidesRow
            leftSide="Agency"
            rightSide={`${sidesRowValues.agencyRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          <SidesRow
            leftSide="Referrer"
            rightSide={`${sidesRowValues.referrerRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          <SidesRow
            leftSide="Trader"
            rightSide={`${sidesRowValues.traderRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
        </Box>
        <div className={styles.divider} />
        <Box className={styles.referrerKickbackInputContainer}>
          <Typography variant="bodySmall">Set Referrer's Kickback Rate:</Typography>
          <OutlinedInput
            type="text"
            inputProps={{ min: 0, max: baseRebate }}
            value={referrersKickbackRate}
            onChange={(event) => handleKickbackRateChange(event, KickbackRateTypeE.REFERRER)}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </Box>
        <Box className={styles.traderKickbackInputContainer}>
          <Typography variant="bodySmall">Set Trader's Kickback Rate:</Typography>
          <OutlinedInput
            type="text"
            inputProps={{ min: 0, max: baseRebate }}
            value={tradersKickbackRate}
            onChange={(event) => handleKickbackRateChange(event, KickbackRateTypeE.TRADER)}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </Box>
        <div className={styles.divider} />
        {props.type === ReferralDialogActionE.CREATE && (
          <Box className={styles.codeInputContainer}>
            <Typography variant="bodySmall" className={styles.codeInputLabel} component="p">
              Enter Referrer Address:
            </Typography>
            <OutlinedInput
              placeholder="Enter an address"
              value={referrerAddressInputValue}
              onChange={handleReferrerAddressChange}
              className={styles.codeInput}
            />
            {!isAddressValid && referrerAddressInputTouchedRef.current && (
              <Typography variant="bodySmall" color="red" component="p" mt={1}>
                Please enter a valid address
              </Typography>
            )}
          </Box>
        )}
        {props.type === ReferralDialogActionE.MODIFY && (
          <Box className={styles.referrerChangeContainer}>
            <Box className={styles.referrerChangeFlexWrapper}>
              <Typography variant="bodySmall" className={styles.codeInputLabel} component="p">
                Change Referrer Address?
              </Typography>
              <Checkbox checked={boxChecked} onChange={() => setBoxChecked((prev) => !prev)} />
            </Box>
            <OutlinedInput
              placeholder="Enter an address"
              value={referrerAddressInputValue}
              onChange={handleReferrerAddressChange}
              disabled={!boxChecked}
              className={styles.codeInput}
            />
            {!isAddressValid && referrerAddressInputTouchedRef.current && (
              <Typography variant="bodySmall" color="red" component="p" mt={1}>
                Please enter a valid address
              </Typography>
            )}
          </Box>
        )}
        <div className={styles.divider} />
        {props.type === ReferralDialogActionE.CREATE && (
          <>
            <Box className={styles.codeInputContainer}>
              <OutlinedInput
                placeholder="Enter a code"
                value={codeInputValue}
                onChange={handleCodeChange}
                className={styles.codeInput}
              />
            </Box>
            <Typography variant="bodyTiny" component="p" className={styles.infoText}>
              Only uppercase characters, numbers, underscores ( _ ) and hyphens (-) are allowed.
            </Typography>
          </>
        )}
        {props.type === ReferralDialogActionE.MODIFY && (
          <Box className={styles.paddedContainer}>
            <SidesRow leftSide="Your code" rightSide={props.code} rightSideStyles={styles.sidesRowValue} />
          </Box>
        )}
        <Box className={styles.dialogActionsContainer}>
          <Button variant="secondary" onClick={props.onClose} className={styles.cancelButton}>
            Cancel
          </Button>
          {props.type === ReferralDialogActionE.CREATE && (
            <Button
              variant="primary"
              disabled={codeInputDisabled || !isAddressValid}
              onClick={handleUpsertCode}
              className={styles.enterCodeButton}
            >
              {codeState === CodeStateE.DEFAULT && 'Enter a code'}
              {codeState === CodeStateE.CODE_TAKEN && 'Code already taken'}
              {codeState === CodeStateE.CODE_AVAILABLE && 'Create code'}
            </Button>
          )}
          {props.type === ReferralDialogActionE.MODIFY && (
            <Button variant="primary" onClick={handleUpsertCode} className={styles.enterCodeButton}>
              Modify
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

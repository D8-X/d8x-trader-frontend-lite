import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { Box, Button, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';

import { postUpsertReferralCode } from 'network/referral';

import { CodeStateE, ReferrerRoleE, useCodeInput, useRebateRate } from 'pages/refer-page/hooks';

import { replaceSymbols } from 'utils/replaceInvalidSymbols';

import { referralCodesRefetchHandlerRefAtom } from 'store/refer.store';

import { ReferralDialogActionE } from 'types/enums';

import styles from './NormalReferrerDialog.module.scss';

interface NormalReferrerDialogCreatePropsI {
  type: ReferralDialogActionE.CREATE;
  onClose: () => void;
}

interface NormalReferrerDialogModifyPropsI {
  type: ReferralDialogActionE.MODIFY;
  code: string;
  onClose: () => void;
  referrerRebatePercent: number;
  traderRebatePercent: number;
}

type UpdatedNormalReferrerDialogPropsT = NormalReferrerDialogCreatePropsI | NormalReferrerDialogModifyPropsI;

export const NormalReferrerDialog = (props: UpdatedNormalReferrerDialogPropsT) => {
  const { t } = useTranslation();
  const [referralCodesRefetchHandler] = useAtom(referralCodesRefetchHandlerRefAtom);

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const { codeInputValue, handleCodeChange, codeState } = useCodeInput(chainId);
  const codeInputDisabled = codeState !== CodeStateE.CODE_AVAILABLE;

  const baseRebate = useRebateRate(chainId, address, ReferrerRoleE.NORMAL);

  const [kickbackRateInputValue, setKickbackRateInputValue] = useState('0');

  useEffect(() => {
    let kickbackRate;
    if (props.type === ReferralDialogActionE.MODIFY) {
      kickbackRate = props.traderRebatePercent;
    } else {
      kickbackRate = 0.25 * baseRebate;
    }
    setKickbackRateInputValue(kickbackRate.toFixed(2));
  }, [baseRebate, props]);

  const sidesRowValues = useMemo(() => {
    const traderRate = +kickbackRateInputValue;
    const userRate = baseRebate > 0 ? baseRebate - traderRate : 0;

    return { userRate: userRate.toFixed(2), traderRate: traderRate.toFixed(2) };
  }, [baseRebate, kickbackRateInputValue]);

  const handleKickbackRateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    const filteredValue = replaceSymbols(value);

    if (+filteredValue > baseRebate) {
      setKickbackRateInputValue(baseRebate.toFixed(2));
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

    const traderRebatePerc = (100 * Number(traderRate)) / rateSum;
    const referrerRebatePerc = (100 * Number(userRate)) / rateSum;

    const code = props.type === ReferralDialogActionE.MODIFY ? props.code : codeInputValue;

    await postUpsertReferralCode(
      chainId,
      address,
      '',
      code,
      traderRebatePerc,
      0,
      referrerRebatePerc,
      walletClient,
      props.onClose
    );
    toast.success(
      <ToastContent
        title={
          props.type === ReferralDialogActionE.CREATE
            ? t('pages.refer.toast.success-create')
            : t('pages.refer.toast.success-modify')
        }
        bodyLines={[]}
      />
    );
    referralCodesRefetchHandler.handleRefresh();
  };

  return (
    <Dialog open={true} onClose={props.onClose}>
      <Box className={styles.dialogRoot}>
        <Typography variant="h5" className={styles.title}>
          {props.type === ReferralDialogActionE.CREATE
            ? t('pages.refer.manage-code.title-create')
            : t('pages.refer.manage-code.title-modify')}
        </Typography>
        <Box className={styles.baseRebateContainer}>
          <Typography variant="bodyMedium" fontWeight={600}>
            {t('pages.refer.manage-code.base')}
          </Typography>
          <Typography variant="bodyMedium" fontWeight={600}>
            {baseRebate}%
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
            inputProps={{ min: 0, max: baseRebate }}
            onChange={handleKickbackRateChange}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </Box>
        <div className={styles.divider} />
        {props.type === ReferralDialogActionE.CREATE && (
          <Box className={styles.codeInputContainer}>
            <OutlinedInput
              placeholder={t('pages.refer.trader-tab.enter-a-code')}
              value={codeInputValue}
              onChange={handleCodeChange}
              className={styles.codeInput}
            />
          </Box>
        )}
        {props.type === ReferralDialogActionE.MODIFY && (
          <Box className={styles.paddedContainer}>
            <SidesRow
              leftSide={t('pages.refer.manage-code.your-code')}
              rightSide={props.code}
              rightSideStyles={styles.sidesRowValue}
            />
          </Box>
        )}
        {props.type === ReferralDialogActionE.CREATE && (
          <Typography variant="bodyTiny" component="p" className={styles.infoText}>
            {t('pages.refer.manage-code.instructions')}
          </Typography>
        )}
        <Box className={styles.dialogActionsContainer}>
          <Button variant="secondary" onClick={props.onClose}>
            {t('pages.refer.manage-code.cancel')}
          </Button>
          {props.type === ReferralDialogActionE.CREATE && (
            <Button variant="primary" disabled={codeInputDisabled} onClick={handleUpsertCode}>
              {codeState === CodeStateE.DEFAULT && t('pages.refer.manage-code.enter-code')}
              {codeState === CodeStateE.CODE_TAKEN && t('pages.refer.manage-code.code-taken')}
              {codeState === CodeStateE.CODE_AVAILABLE && t('pages.refer.manage-code.create-code')}
            </Button>
          )}
          {props.type === ReferralDialogActionE.MODIFY && (
            <Button variant="primary" onClick={handleUpsertCode} className={styles.modifyCodeButton}>
              {t('pages.refer.manage-code.modify')}
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

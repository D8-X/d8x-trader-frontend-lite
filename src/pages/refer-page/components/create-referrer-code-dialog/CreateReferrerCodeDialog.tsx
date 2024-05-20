import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { useAccount, useWalletClient } from 'wagmi';

import { Button, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { postUpsertCode } from 'network/referral';
import { useCodeInput } from 'pages/refer-page/hooks';
import { commissionRateAtom, referralCodesRefetchHandlerRefAtom } from 'store/refer.store';
import { isEnabledChain } from 'utils/isEnabledChain';
import { replaceSymbols } from 'utils/replaceInvalidSymbols';

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
  const { address, chainId } = useAccount();

  const { codeInputValue, setCodeInputValue, handleCodeChange, codeState } = useCodeInput(chainId);
  const codeInputDisabled = codeState !== CodeStateE.CODE_AVAILABLE || !isEnabledChain(chainId);

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

    if (+filteredValue > commissionRate - 0.01) {
      setKickbackRateInputValue((commissionRate - 0.01).toFixed(2));
      return;
    }
    setKickbackRateInputValue(filteredValue);
  };

  const handleUpsertCode = () => {
    if (!address || !walletClient || !isEnabledChain(chainId)) {
      return;
    }

    const { userRate, traderRate } = sidesRowValues;

    postUpsertCode(chainId, address, codeInputValue, Number(userRate), Number(traderRate), walletClient, onClose)
      .then(() => {
        toast.success(<ToastContent title={t('pages.refer.toast.success-create')} bodyLines={[]} />);
        setCodeInputValue('');
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
          {t('pages.refer.manage-code.title-create')}
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
            leftSide={t('pages.refer.manage-code.you-receive')}
            rightSide={`${sidesRowValues.userRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
          <SidesRow
            leftSide={t('pages.refer.manage-code.trader-receives')}
            rightSide={`${sidesRowValues.traderRate}%`}
            rightSideStyles={styles.sidesRowValue}
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.kickbackRateInputContainer}>
          <Typography variant="bodySmall">{t('pages.refer.manage-code.trader-kickback')}</Typography>
          <OutlinedInput
            type="text"
            value={kickbackRateInputValue}
            inputProps={{ min: 0, max: commissionRate }}
            onChange={handleKickbackRateChange}
            className={styles.kickbackInput}
            endAdornment="%"
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.codeInputContainer}>
          <OutlinedInput
            placeholder={t('pages.refer.trader-tab.enter-a-code')}
            value={codeInputValue}
            onChange={handleCodeChange}
            className={styles.codeInput}
          />
        </div>
        <Typography variant="bodyTiny" component="p" className={styles.infoText}>
          {t('pages.refer.manage-code.instructions')}
        </Typography>
        <div className={styles.dialogActionsContainer}>
          <Button variant="secondary" onClick={onClose}>
            {t('pages.refer.manage-code.cancel')}
          </Button>
          <Button variant="primary" disabled={codeInputDisabled} onClick={handleUpsertCode}>
            {codeState === CodeStateE.DEFAULT && t('pages.refer.manage-code.enter-code')}
            {codeState === CodeStateE.CODE_TAKEN && t('pages.refer.manage-code.code-taken')}
            {codeState === CodeStateE.CODE_AVAILABLE && t('pages.refer.manage-code.create-code')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

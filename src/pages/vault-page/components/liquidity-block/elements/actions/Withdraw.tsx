import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useWaitForTransactionReceipt, useWalletClient, useReadContract } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { PERIOD_OF_2_DAYS } from 'appConstants';
import { executeLiquidityWithdrawal } from 'blockchain-api/contract-interactions/executeLiquidityWithdrawal';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import {
  dCurrencyPriceAtom,
  triggerUserStatsUpdateAtom,
  triggerWithdrawalsUpdateAtom,
  userAmountAtom,
  withdrawalOnChainAtom,
  withdrawalsAtom,
} from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import { Initiate } from './Initiate';

import styles from './Action.module.scss';
import { getTxnLink } from 'helpers/getTxnLink';
import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { Address } from 'viem';

interface WithdrawPropsI {
  withdrawOn: string;
}

enum ValidityCheckWithdrawE {
  NoAddress = 'no-address',
  NoInitiation = 'no-initiation',
  NoFunds = 'no-funds',
  GoodToGo = 'good-to-go',
}

export const Withdraw = memo(({ withdrawOn }: WithdrawPropsI) => {
  const { t } = useTranslation();
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [liqProvTool] = useAtom(traderAPIAtom);
  const [dCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [userAmount] = useAtom(userAmountAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const setTriggerWithdrawalsUpdate = useSetAtom(triggerWithdrawalsUpdateAtom);
  const setTriggerUserStatsUpdate = useSetAtom(triggerUserStatsUpdateAtom);
  const [hasOpenRequestOnChain, setWithrawalOnChain] = useAtom(withdrawalOnChainAtom);

  const { data: walletClient } = useWalletClient();
  const { address, chain } = useAccount();

  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);

  const requestSentRef = useRef(false);

  const { data: openRequests, refetch: refetchOnChainStatus } = useReadContract({
    address: liqProvTool?.getProxyAddress() as Address,
    abi: PROXY_ABI,
    query: { enabled: !!liqProvTool && !!selectedPool?.poolId },
    functionName: 'getWithdrawRequests',
    args: [selectedPool?.poolId as number, 0, 256],
  });

  useEffect(() => {
    if (!openRequests || !walletClient) {
      return undefined;
    }
    const res = (openRequests as unknown[]).some(
      (req) => (req as { lp: string }).lp.toLowerCase() === walletClient.account.address.toLowerCase()
    );
    setWithrawalOnChain(res);
  }, [openRequests, walletClient, setWithrawalOnChain]);

  const {
    isSuccess,
    isError,
    isFetched,
    error: reason,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  useEffect(() => {
    if (!isFetched) {
      return;
    }
    setTxHash(undefined);
    setTriggerUserStatsUpdate((prevValue) => !prevValue);
    refetchOnChainStatus();
  }, [isFetched, refetchOnChainStatus, setTriggerUserStatsUpdate]);

  useEffect(() => {
    if (!isError || !reason) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('pages.vault.toast.error.title')}
        bodyLines={[{ label: t('pages.vault.toast.error.body'), value: reason.message }]}
      />
    );
  }, [isError, reason, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    toast.success(
      <ToastContent
        title={t('pages.vault.toast.withdrawn')}
        bodyLines={[
          {
            label: '',
            value: (
              <a
                href={getTxnLink(chain?.blockExplorers?.default?.url, txHash)}
                target="_blank"
                rel="noreferrer"
                className={styles.shareLink}
              >
                {txHash}
              </a>
            ),
          },
        ]}
      />
    );
  }, [isSuccess, txHash, chain, t]);

  const handleWithdrawLiquidity = () => {
    if (requestSentRef.current) {
      return;
    }

    if (!liqProvTool || !selectedPool || !walletClient) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    executeLiquidityWithdrawal(walletClient, liqProvTool, selectedPool.poolSymbol)
      .then((tx) => {
        setTxHash(tx.hash);
        toast.success(<ToastContent title={t('pages.vault.toast.withdrawing')} bodyLines={[]} />);
      })
      .catch((err) => {
        console.error(err);
        let msg = (err?.message ?? err) as string;
        msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
        toast.error(
          <ToastContent
            title={t('pages.vault.toast.error-withdrawing.title')}
            bodyLines={[{ label: t('pages.vault.toast.error-withdrawing.body'), value: msg }]}
          />
        );
      })
      .finally(() => {
        setTriggerUserStatsUpdate((prevValue) => !prevValue);
        setTriggerWithdrawalsUpdate((prevValue) => !prevValue);
        requestSentRef.current = false;
        setRequestSent(false);
      });
  };

  const shareAmount = useMemo(() => {
    if (!withdrawals) {
      return;
    }
    if (withdrawals.length === 0) {
      return 0;
    }
    const currentTime = Date.now();
    const latestWithdrawal = withdrawals[withdrawals.length - 1];
    const latestWithdrawalTimeElapsed = latestWithdrawal.timeElapsedSec * 1000;

    const withdrawalTime = currentTime + PERIOD_OF_2_DAYS - latestWithdrawalTimeElapsed;
    if (currentTime < withdrawalTime) {
      return 0;
    } else {
      return latestWithdrawal.shareAmount;
    }
  }, [withdrawals]);

  const predictedAmount = useMemo(() => {
    if (!withdrawals) {
      return;
    }
    if (withdrawals.length === 0) {
      return 0;
    }
    const latestWithdrawal = withdrawals[withdrawals.length - 1];

    if (dCurrencyPrice) {
      return latestWithdrawal.shareAmount * dCurrencyPrice;
    }
    return 0;
  }, [dCurrencyPrice, withdrawals]);

  const isButtonDisabled = !userAmount || !shareAmount || requestSent;

  const validityCheckWithdrawType = useMemo(() => {
    if (!address) {
      return ValidityCheckWithdrawE.NoAddress;
    }
    if (!userAmount || userAmount === 0) {
      return ValidityCheckWithdrawE.NoFunds;
    }
    if (!shareAmount || shareAmount === 0) {
      return ValidityCheckWithdrawE.NoInitiation;
    }
    return ValidityCheckWithdrawE.GoodToGo;
  }, [address, userAmount, shareAmount]);

  const validityCheckWithdrawText = useMemo(() => {
    if (validityCheckWithdrawType === ValidityCheckWithdrawE.NoAddress) {
      return `${t('pages.vault.withdraw.action.validity-no-address')}`;
    } else if (validityCheckWithdrawType === ValidityCheckWithdrawE.NoFunds) {
      return `${t('pages.vault.withdraw.action.validity-no-funds')}`;
    } else if (validityCheckWithdrawType === ValidityCheckWithdrawE.NoInitiation) {
      return `${t('pages.vault.withdraw.action.validity-no-initiation')}`;
    }
    return t('pages.vault.withdraw.action.button');
  }, [t, validityCheckWithdrawType]);

  return (
    <div className={styles.root}>
      <Box className={styles.infoBlock}>
        <Typography variant="h5" color={'var(--d8x-color-text-main)'}>
          {t('pages.vault.withdraw.title')}
        </Typography>
        <Typography variant="body2" className={styles.text}>
          {t('pages.vault.withdraw.info1')}
        </Typography>
        <Typography variant="body2" className={styles.text}>
          {t('pages.vault.withdraw.info2', { poolSymbol: selectedPool?.poolSymbol })}
        </Typography>
      </Box>
      <Box className={styles.contentBlock}>
        {!withdrawals.length && !hasOpenRequestOnChain && (
          <>
            <Initiate />
            <Separator className={styles.separator} />
          </>
        )}
        <Box className={styles.withdrawLabel}>
          <InfoLabelBlock
            title={
              <>
                {!withdrawals.length && '2.'}{' '}
                {t('pages.vault.withdraw.action.title', { poolSymbol: selectedPool?.poolSymbol })}
              </>
            }
            content={
              <Typography>
                {t('pages.vault.withdraw.action.info1', { poolSymbol: selectedPool?.poolSymbol })}
              </Typography>
            }
          />
        </Box>
        <Box className={styles.summaryBlock}>
          <Box className={styles.row}>
            <Typography variant="body2">{t('pages.vault.withdraw.action.date')}</Typography>
            <Typography variant="body2">
              <strong>{withdrawOn}</strong>
            </Typography>
          </Box>
          <Box className={styles.row}>
            <Typography variant="body2">{t('pages.vault.withdraw.action.receive')}</Typography>
            <Typography variant="body2">
              <strong>{formatToCurrency(predictedAmount, selectedPool?.poolSymbol)}</strong>
            </Typography>
          </Box>
        </Box>
        <Box>
          <GasDepositChecker className={styles.actionButton}>
            <Button
              variant="primary"
              onClick={handleWithdrawLiquidity}
              className={styles.actionButton}
              disabled={isButtonDisabled}
            >
              {validityCheckWithdrawText}
            </Button>
          </GasDepositChecker>
        </Box>
      </Box>
    </div>
  );
});

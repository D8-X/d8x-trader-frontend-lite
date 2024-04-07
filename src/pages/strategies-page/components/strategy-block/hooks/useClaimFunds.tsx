import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';

import { ToastContent } from 'components/toast-content/ToastContent';
import { enableFrequentUpdatesAtom } from 'store/strategies.store';
import { formatToCurrency } from 'utils/formatToCurrency';

export const useClaimFunds = (hasPosition: boolean | null, strategyAddressBalance: number | null) => {
  const { t } = useTranslation();

  const { address } = useAccount();

  const enableFrequentUpdates = useSetAtom(enableFrequentUpdatesAtom);

  const [txHash, setTxHash] = useState<Address | undefined>(undefined);
  const [claimedBalance, setClaimedBalance] = useState(0);

  useEffect(() => {
    if (strategyAddressBalance !== null && strategyAddressBalance > 0) {
      setClaimedBalance(strategyAddressBalance);
    }
  }, [strategyAddressBalance]);

  const { isSuccess, isError, isFetched, error } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!txHash && hasPosition === false },
  });

  useEffect(() => {
    if (!isFetched || !txHash) {
      return;
    }
    setTxHash(undefined);
  }, [isFetched, txHash]);

  useEffect(() => {
    if (!isError || !error || !txHash) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('pages.strategies.claim-funds.toasts.tx-failed.title')}
        bodyLines={[
          {
            label: t('pages.strategies.claim-funds.toasts.tx-failed.body'),
            value: error.message,
          },
        ]}
      />
    );
  }, [isError, error, txHash, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    toast.success(
      <ToastContent
        title={t('pages.strategies.claim-funds.toasts.tx-submitted.title')}
        bodyLines={[
          {
            label: t('pages.strategies.claim-funds.toasts.tx-submitted.body'),
            value: formatToCurrency(claimedBalance, 'weETH'),
          },
        ]}
      />
    );
    enableFrequentUpdates(true);
    setClaimedBalance(0);
  }, [isSuccess, txHash, enableFrequentUpdates, claimedBalance, t]);

  return {
    setTxHash,
  };
};

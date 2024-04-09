import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';

import { ToastContent } from 'components/toast-content/ToastContent';

export const useRemoveDelegateHash = (successCallback: () => void, errorCallback: () => void) => {
  const { t } = useTranslation();

  const { address } = useAccount();

  const [txHash, setTxHash] = useState<Address | undefined>(undefined);

  const { isSuccess, isError, isFetched, error } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!txHash },
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
        title={t('common.settings.one-click-modal.funding-modal.toasts.tx-failed.title')}
        bodyLines={[
          {
            label: t('common.settings.one-click-modal.funding-modal.toasts.tx-failed.body'),
            value: error.message,
          },
        ]}
      />
    );
    errorCallback();
    setTxHash(undefined);
  }, [isError, error, txHash, errorCallback, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    toast.success(
      <ToastContent title={t('common.settings.one-click-modal.manage-delegate.remove-action-result')} bodyLines={[]} />
    );
    successCallback();
    setTxHash(undefined);
  }, [isSuccess, txHash, successCallback, t]);

  return {
    setTxHash,
  };
};

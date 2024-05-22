import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';

import { ToastContent } from 'components/toast-content/ToastContent';
import { formatToCurrency } from 'utils/formatToCurrency';

export const useTransferGasToken = (amount: string, currency: string | undefined, successCallback?: () => void) => {
  const { t } = useTranslation();

  const { address } = useAccount();

  const [txHash, setTxHash] = useState<Address>();
  const [savedAmount, setSavedAmount] = useState('');
  const [savedCurrency, setSavedCurrency] = useState('');

  const { isSuccess, isError, isFetched, error } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!txHash && savedAmount !== '' },
  });

  useEffect(() => {
    if (amount !== '' && currency) {
      setSavedAmount(amount);
      setSavedCurrency(currency);
    }
  }, [amount, currency]);

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
        title={t('common.withdraw-modal.toasts.tx-failed.title')}
        bodyLines={[
          {
            label: t('common.withdraw-modal.toasts.tx-failed.body'),
            value: error.message,
          },
        ]}
      />
    );
    setTxHash(undefined);
  }, [isError, error, txHash, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    toast.success(
      <ToastContent
        title={t('common.withdraw-modal.toasts.tx-submitted.title')}
        bodyLines={[
          {
            label: t('common.withdraw-modal.toasts.tx-submitted.body'),
            value: formatToCurrency(+savedAmount, savedCurrency),
          },
        ]}
      />
    );
    setSavedAmount('');
    setSavedCurrency('');
    successCallback && successCallback();
    setTxHash(undefined);
  }, [isSuccess, txHash, savedAmount, savedCurrency, successCallback, t]);

  return {
    setTxHash,
  };
};

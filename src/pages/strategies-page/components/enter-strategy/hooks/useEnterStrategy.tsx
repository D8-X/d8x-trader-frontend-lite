import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useReadContract, useWaitForTransactionReceipt } from 'wagmi';

import { ToastContent } from 'components/toast-content/ToastContent';
import {
  enableFrequentUpdatesAtom,
  ORDER_STATUS_INTERVAL,
  perpetualStrategyStaticInfoAtom,
} from 'store/strategies.store';
import { formatToCurrency } from 'utils/formatToCurrency';
import { LOB_ABI, OrderStatus } from '@d8x/perpetuals-sdk';

export const useEnterStrategy = (amount: number) => {
  const { t } = useTranslation();

  const { address } = useAccount();

  const strategyPerpetual = useAtomValue(perpetualStrategyStaticInfoAtom);
  const enableFrequentUpdates = useSetAtom(enableFrequentUpdatesAtom);

  const [txHash, setTxHash] = useState<Address>();
  const [orderId, setOrderId] = useState<string>();
  const [isExecuted, setExecuted] = useState<boolean>(false);

  const { isSuccess, isError, isFetched, error } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!txHash && amount >= 0.01 },
  });

  const { data: orderStatus } = useReadContract({
    address: strategyPerpetual?.limitOrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'getOrderStatus',
    query: {
      enabled: !!strategyPerpetual?.limitOrderBookAddr && !!orderId,
      refetchInterval: ORDER_STATUS_INTERVAL,
    },
    args: [orderId as string],
  });

  useEffect(() => {
    if (orderStatus === OrderStatus.EXECUTED) {
      setExecuted(true);
      setOrderId(undefined);
    } else if (orderStatus === OrderStatus.CANCELED) {
      toast.error(<ToastContent title={t('pages.strategies.enter.toasts.tx-failed.title')} bodyLines={[]} />);
      setExecuted(true);
      setOrderId(undefined);
    }
  }, [orderStatus, t]);

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
        title={t('pages.strategies.enter.toasts.tx-failed.title')}
        bodyLines={[
          {
            label: t('pages.strategies.enter.toasts.tx-failed.body'),
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
        title={t('pages.strategies.enter.toasts.tx-submitted.title')}
        bodyLines={[
          {
            label: t('pages.strategies.enter.toasts.tx-submitted.body'),
            value: formatToCurrency(amount, 'weETH'),
          },
        ]}
      />
    );
    enableFrequentUpdates(true);
  }, [isSuccess, txHash, amount, enableFrequentUpdates, t]);

  return {
    isExecuted,
    setOrderId,
    setTxHash,
  };
};

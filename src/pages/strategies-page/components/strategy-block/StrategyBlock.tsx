import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useChainId, useReadContracts, useSendTransaction, useWalletClient } from 'wagmi';

import { CircularProgress } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { claimStrategyFunds } from 'blockchain-api/contract-interactions/claimStrategyFunds';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getOpenOrders, getPositionRisk } from 'network/network';
import { traderAPIAtom } from 'store/pools.store';
import {
  enableFrequentUpdatesAtom,
  hasPositionAtom,
  strategyAddressesAtom,
  strategyPoolAtom,
  strategyPositionAtom,
} from 'store/strategies.store';
import { OrderI } from 'types/types';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { EnterStrategy } from '../enter-strategy/EnterStrategy';
import { ExitStrategy } from '../exit-strategy/ExitStrategy';
import { Overview } from '../overview/Overview';

import styles from './StrategyBlock.module.scss';

import { useClaimFunds } from './hooks/useClaimFunds';
import { OrderSideE } from '../../../../types/enums';

const INTERVAL_FOR_DATA_POLLING = 5_000; // Each 5 sec
const INTERVAL_FREQUENT_POLLING = 2_000; // Each 1 sec
const MAX_FREQUENT_UPDATES = 15;

export const StrategyBlock = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { sendTransactionAsync } = useSendTransaction();

  const traderAPI = useAtomValue(traderAPIAtom);
  const strategyPool = useAtomValue(strategyPoolAtom);
  const [hasPosition, setHasPosition] = useAtom(hasPositionAtom);
  const [isFrequentUpdates, enableFrequentUpdates] = useAtom(enableFrequentUpdatesAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const setStrategyPosition = useSetAtom(strategyPositionAtom);

  const [frequentUpdates, setFrequentUpdates] = useState(0);
  const [hadPosition, setHadPosition] = useState(hasPosition);
  const [refetchBalanceRequestSent, setRefetchBalanceRequestSent] = useState(false);
  const [triggerClaimFunds, setTriggerClaimFunds] = useState(false);
  const [strategyOpenOrders, setStrategyOpenOrders] = useState<Record<string, OrderI>>({});

  const strategyPositionRequestSentRef = useRef(false);
  const openOrdersRequestSentRef = useRef(false);
  const claimRequestSentRef = useRef(false);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  const {
    data: strategyAddressBalanceData,
    refetch: refetchStrategyAddressBalance,
    isRefetching,
    isFetched,
  } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: strategyPool?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [strategyAddress!],
      },
      {
        address: strategyPool?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled: strategyAddress && traderAPI?.chainId === chainId && !!strategyPool?.marginTokenAddr && isConnected,
    },
  });

  const strategyAddressBalance = strategyAddressBalanceData
    ? +formatUnits(strategyAddressBalanceData[0], strategyAddressBalanceData[1])
    : null;

  useEffect(() => {
    if (isRefetching) {
      setRefetchBalanceRequestSent(true);
    } else if (isFetched) {
      setRefetchBalanceRequestSent(false);
    }
  }, [isRefetching, isFetched]);

  const { setTxHash } = useClaimFunds(hasPosition, strategyAddressBalance, refetchStrategyAddressBalance);

  useEffect(() => {
    refetchStrategyAddressBalance().then();
  }, [refetchStrategyAddressBalance, hasPosition]);

  const fetchStrategyPosition = useCallback(
    (frequentUpdatesEnabled: boolean) => {
      if (strategyPositionRequestSentRef.current || !strategyAddress || !address) {
        return;
      }

      if (frequentUpdatesEnabled) {
        setFrequentUpdates((prevState) => prevState + 1);
      }

      strategyPositionRequestSentRef.current = true;

      getPositionRisk(chainId, null, strategyAddress)
        .then(({ data: positions }) => {
          if (positions && positions.length > 0) {
            const strategy = positions.find(
              ({ symbol, positionNotionalBaseCCY }) => symbol === STRATEGY_SYMBOL && positionNotionalBaseCCY !== 0
            );
            setHasPosition(!!strategy);
            setStrategyPosition(strategy);
          }
        })
        .finally(() => {
          strategyPositionRequestSentRef.current = false;
        });
    },
    [chainId, strategyAddress, address, setStrategyPosition, setHasPosition]
  );

  const fetchStrategyOpenOrders = useCallback(() => {
    if (openOrdersRequestSentRef.current || !strategyAddress || !address) {
      return;
    }

    openOrdersRequestSentRef.current = true;

    getOpenOrders(chainId, null, strategyAddress)
      .then((data) => {
        const updatedOpenOrders: Record<string, OrderI> = {};
        data.data.map((openOrders) => {
          openOrders.orderIds?.forEach((orderId, index) => (updatedOpenOrders[orderId] = openOrders.orders[index]));
        });
        setStrategyOpenOrders(updatedOpenOrders);
      })
      .catch((error) => {
        console.error(error);
        setStrategyOpenOrders({});
      })
      .finally(() => {
        openOrdersRequestSentRef.current = false;
      });
  }, [chainId, strategyAddress, address]);

  useEffect(() => {
    fetchStrategyPosition(isFrequentUpdates);
    fetchStrategyOpenOrders();

    const intervalId = setInterval(
      () => {
        fetchStrategyPosition(isFrequentUpdates);
        fetchStrategyOpenOrders();
      },
      isFrequentUpdates ? INTERVAL_FREQUENT_POLLING : INTERVAL_FOR_DATA_POLLING
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchStrategyPosition, fetchStrategyOpenOrders, isFrequentUpdates]);

  // This happens when we Enter strategy. OpenOrder is created, but not executed
  const hasSellOpenOrder = useMemo(() => {
    const ordersIds = Object.keys(strategyOpenOrders);
    if (ordersIds.length === 0) {
      return false;
    }
    const orders = Object.values(strategyOpenOrders);
    const foundSellOpenOrder = orders.find(
      (openOrder) => openOrder.symbol === STRATEGY_SYMBOL && openOrder.side === OrderSideE.Sell
    );
    return !!foundSellOpenOrder;
  }, [strategyOpenOrders]);

  // This happens when we Exit strategy. OpenOrder is created, but not executed
  const hasBuyOpenOrder = useMemo(() => {
    const ordersIds = Object.keys(strategyOpenOrders);
    if (ordersIds.length === 0) {
      return false;
    }
    const orders = Object.values(strategyOpenOrders);
    const foundBuyOpenOrder = orders.find(
      (openOrder) => openOrder.symbol === STRATEGY_SYMBOL && openOrder.side === OrderSideE.Buy
    );
    return !!foundBuyOpenOrder;
  }, [strategyOpenOrders]);

  useEffect(() => {
    if (frequentUpdates >= MAX_FREQUENT_UPDATES) {
      setFrequentUpdates(0);
      enableFrequentUpdates(false);
    }
  }, [frequentUpdates, enableFrequentUpdates]);

  useEffect(() => {
    if (
      !hasPosition &&
      hadPosition &&
      !hasBuyOpenOrder &&
      !claimRequestSentRef.current &&
      !refetchBalanceRequestSent &&
      strategyAddressBalance !== null &&
      strategyAddressBalance > 0 &&
      traderAPI &&
      walletClient
    ) {
      claimRequestSentRef.current = true;
      console.log('claiming funds');
      claimStrategyFunds({ chainId, walletClient, symbol: STRATEGY_SYMBOL, traderAPI }, sendTransactionAsync)
        .then(({ hash }) => {
          if (hash) {
            setTxHash(hash);
            console.log('claiming funds::success');
          } else {
            console.log('claiming funds::no hash');
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error(<ToastContent title={error.shortMessage || error.message} bodyLines={[]} />);
          setTriggerClaimFunds((prev) => !prev);
        })
        .finally(() => {
          claimRequestSentRef.current = false;
        });
    }
  }, [
    hasPosition,
    hadPosition,
    hasBuyOpenOrder,
    refetchBalanceRequestSent,
    strategyAddressBalance,
    chainId,
    traderAPI,
    walletClient,
    setTxHash,
    sendTransactionAsync,
    triggerClaimFunds,
  ]);

  useEffect(() => {
    if (
      !hasPosition &&
      strategyAddressBalance !== null &&
      strategyAddressBalance > 0 &&
      !claimRequestSentRef.current &&
      !refetchBalanceRequestSent &&
      !hasSellOpenOrder
    ) {
      setHadPosition(true);
    }
  }, [hasPosition, hasSellOpenOrder, refetchBalanceRequestSent, strategyAddressBalance]);

  // Reset all states
  useEffect(() => {
    setStrategyOpenOrders({});
    setHasPosition(false);
    setHadPosition(false);
    setFrequentUpdates(0);
    enableFrequentUpdates(false);
  }, [chainId, address, setHasPosition, enableFrequentUpdates]);

  return (
    <div className={styles.root}>
      <Overview />
      <div className={styles.actionBlock}>
        <Disclaimer
          title={t('pages.strategies.info.title')}
          textBlocks={[t('pages.strategies.info.text1'), t('pages.strategies.info.text2')]}
        />
        <div className={styles.divider} />
        {hasPosition === null || strategyAddressBalance === null ? (
          <div className={styles.emptyBlock}>
            <div className={styles.loaderWrapper}>
              <CircularProgress />
            </div>
          </div>
        ) : (
          <>
            {!hasSellOpenOrder && (hasPosition || (!hasPosition && strategyAddressBalance > 0)) && (
              <ExitStrategy isLoading={!hasPosition && strategyAddressBalance > 0} />
            )}
            {((!hasPosition && strategyAddressBalance === 0) || hasSellOpenOrder) && (
              <EnterStrategy isLoading={hasSellOpenOrder} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

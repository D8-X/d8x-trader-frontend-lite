import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Address, erc20Abi, formatUnits, WalletClient } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { CircularProgress } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { getOpenOrders, getPositionRisk } from 'network/network';
import { traderAPIAtom } from 'store/pools.store';
import {
  enableFrequentUpdatesAtom,
  hasPositionAtom,
  strategyAddressesAtom,
  strategyPoolAtom,
  strategyPositionAtom,
} from 'store/strategies.store';
import { OrderSideE } from 'types/enums';
import { type OrderI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { EnterStrategy } from '../enter-strategy/EnterStrategy';
import { ExitStrategy } from '../exit-strategy/ExitStrategy';
import { Overview } from '../overview/Overview';

import styles from './StrategyBlock.module.scss';

const INTERVAL_FOR_DATA_POLLING = 5_000; // Each 5 sec
const INTERVAL_FREQUENT_POLLING = 2_000; // Each 1 sec
const MAX_FREQUENT_UPDATES = 15;

export const StrategyBlock = ({ strategyClient }: { strategyClient: WalletClient }) => {
  const { t } = useTranslation();

  const { address, chainId, isConnected } = useAccount();

  const traderAPI = useAtomValue(traderAPIAtom);
  const strategyPool = useAtomValue(strategyPoolAtom);
  const [hasPosition, setHasPosition] = useAtom(hasPositionAtom);
  const [isFrequentUpdates, enableFrequentUpdates] = useAtom(enableFrequentUpdatesAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const setStrategyPosition = useSetAtom(strategyPositionAtom);

  const [frequentUpdates, setFrequentUpdates] = useState(0);
  const [strategyOpenOrders, setStrategyOpenOrders] = useState<Record<string, OrderI>>({});

  const strategyPositionRequestSentRef = useRef(false);
  const openOrdersRequestSentRef = useRef(false);
  const currentState = useRef(5);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  const { data: strategyAddressBalanceData, refetch: refetchStrategyAddressBalance } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: strategyPool?.settleTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [strategyAddress!],
      },
      {
        address: strategyPool?.settleTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled:
        strategyAddress &&
        Number(traderAPI?.chainId) === chainId &&
        isEnabledChain(chainId) &&
        !!strategyPool?.settleTokenAddr &&
        isConnected,
      refetchInterval: INTERVAL_FOR_DATA_POLLING,
    },
  });

  const strategyAddressBalance = strategyAddressBalanceData
    ? +formatUnits(strategyAddressBalanceData[0], strategyAddressBalanceData[1])
    : null;

  useEffect(() => {
    refetchStrategyAddressBalance().then();
  }, [refetchStrategyAddressBalance, hasPosition]);

  const fetchStrategyPosition = useCallback(
    (frequentUpdatesEnabled: boolean) => {
      if (strategyPositionRequestSentRef.current || !strategyAddress || !address || !isEnabledChain(chainId)) {
        return;
      }

      if (frequentUpdatesEnabled) {
        setFrequentUpdates((prevState) => prevState + 1);
      }

      strategyPositionRequestSentRef.current = true;

      getPositionRisk(chainId, traderAPI, strategyAddress)
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
    [chainId, strategyAddress, traderAPI, address, setStrategyPosition, setHasPosition]
  );

  const fetchStrategyOpenOrders = useCallback(() => {
    if (openOrdersRequestSentRef.current || !strategyAddress || !address || !isEnabledChain(chainId)) {
      return;
    }

    openOrdersRequestSentRef.current = true;

    getOpenOrders(chainId, null, strategyAddress)
      .then((data) => {
        const updatedOpenOrders: Record<string, OrderI> = {};
        if (data.data) {
          data.data.map((openOrders) => {
            openOrders.orderIds?.forEach((orderId, index) => (updatedOpenOrders[orderId] = openOrders.orders[index]));
          });
        }
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
      strategyPositionRequestSentRef.current = false;
      openOrdersRequestSentRef.current = false;
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

  // Reset all states
  useEffect(() => {
    setStrategyOpenOrders({});
    setHasPosition(null);
    setFrequentUpdates(0);
    enableFrequentUpdates(false);
  }, [chainId, address, setHasPosition, enableFrequentUpdates]);

  // X(x,y,z,w) := (has position, has open sell, has open buy, has balance) \in [0,1]^4
  // A(0,0,0,0) -> B(0,0,0,1) (send funds success), A(send funds fails)
  // B(0,0,0,1) -> B(0,0,0,1) (post order/claim funds fail), C(0,1,0,1) (post order success), A(0,0,0,0) (claim funds success)
  // C(0,1,0,1) -> B(0,0,0,1) (exec fail), D(1,0,0,1) (exec success)
  // D(1,0,0,1) -> D(1,0,0,1) (close pos fail), E(1,0,1,1) (close order succs)
  // E(1,0,1,1) -> D(1,0,0,1) (exec fail), B(0,0,0,1) (exec success)
  // F(else)    -> A, B, C, D, E (transient state, e.g. waiting for a confirmation or event)
  // A <-> B-B <-> C -> D-D <-> E -> B

  const prevState = useMemo(() => {
    if (
      !hasPosition &&
      !hasSellOpenOrder &&
      !hasBuyOpenOrder &&
      strategyAddressBalance != null &&
      strategyAddressBalance === 0
    ) {
      return 0; // A: can enter
    } else if (
      !hasPosition &&
      !hasSellOpenOrder &&
      !hasBuyOpenOrder &&
      strategyAddressBalance != null &&
      strategyAddressBalance > 0
    ) {
      return 1; // B: can enter or exit
    } else if (
      !hasPosition &&
      hasSellOpenOrder &&
      !hasBuyOpenOrder &&
      strategyAddressBalance != null &&
      strategyAddressBalance > 0
    ) {
      return 2; // C: trying to enter, has to wait in enter screen
    } else if (
      hasPosition &&
      !hasSellOpenOrder &&
      !hasBuyOpenOrder &&
      strategyAddressBalance != null &&
      strategyAddressBalance > 0
    ) {
      return 3; // D: can exit
    } else if (
      hasPosition &&
      !hasSellOpenOrder &&
      hasBuyOpenOrder &&
      strategyAddressBalance != null &&
      strategyAddressBalance > 0
    ) {
      return 4; // E: trying to exit, has to wait in exit screen
    } else {
      return 5; // F: in between states, has to wait in current screen
    }
  }, [hasPosition, hasSellOpenOrder, hasBuyOpenOrder, strategyAddressBalance]);

  useEffect(() => {
    // if entering and now funded, keep waiting
    if (currentState.current === 0 && prevState === 1) {
      return;
    }
    // keep current state on transient change
    if (prevState !== 5) {
      currentState.current = prevState;
    }
  }, [prevState]);

  const showExitScreen = [1, 3, 4].includes(currentState.current);

  return (
    <div className={styles.root}>
      <Overview />
      <div className={styles.actionBlock}>
        <Disclaimer
          title={t('pages.strategies.info.title')}
          textBlocks={[t('pages.strategies.info.text1'), t('pages.strategies.info.text2')]}
        />
        <div className={styles.divider} />
        {currentState.current === 5 || strategyAddressBalance === null ? (
          <div className={styles.emptyBlock}>
            <div className={styles.loaderWrapper}>
              <CircularProgress />
            </div>
          </div>
        ) : (
          <>
            {showExitScreen && (
              <ExitStrategy
                isLoading={hasBuyOpenOrder || prevState === 5}
                hasBuyOpenOrder={hasBuyOpenOrder}
                strategyClient={strategyClient}
                strategyAddressBalance={strategyAddressBalance}
                refetchStrategyAddressBalance={refetchStrategyAddressBalance}
                strategyAddressBalanceBigint={strategyAddressBalanceData?.[0] ?? 0n}
              />
            )}
            {!showExitScreen && (
              <EnterStrategy isLoading={hasSellOpenOrder || prevState === 5} strategyClient={strategyClient} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

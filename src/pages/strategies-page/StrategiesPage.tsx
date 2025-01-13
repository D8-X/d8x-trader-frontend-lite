import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useLocation } from 'react-router-dom';

import { STRATEGY_BASE_CURRENCY, STRATEGY_POOL_SYMBOL, STRATEGY_QUOTE_CURRENCY, STRATEGY_SYMBOL } from 'appConstants';
import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { allPerpetualStatisticsPrimitiveAtom, poolsAtom, traderAPIAtom } from 'store/pools.store';
import {
  strategyAddressesAtom,
  strategyPerpetualAtom,
  strategyPerpetualStatsAtom,
  strategyPoolAtom,
  perpetualStrategyStaticInfoAtom,
  activeStrategyWalletAtom,
} from 'store/strategies.store';
import { getPerpetualStaticInfo } from 'network/network';

import { ConnectBlock } from './components/connect-block/ConnectBlock';
import { StrategyBlock } from './components/strategy-block/StrategyBlock';
import { StrategyPoolSubscription } from './components/StrategyPoolSubscription';
import { getEnabledChainId } from 'utils/getEnabledChainId';

import styles from './StrategiesPage.module.scss';

export const StrategiesPage = () => {
  const { address, chainId } = useAccount();
  const location = useLocation();

  const pools = useAtomValue(poolsAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const activeStrategyWallet = useAtomValue(activeStrategyWalletAtom);
  const allPerpetualStatistics = useAtomValue(allPerpetualStatisticsPrimitiveAtom);
  const setStrategyPool = useSetAtom(strategyPoolAtom);
  const setStrategyPerpetual = useSetAtom(strategyPerpetualAtom);
  const setStrategyPerpetualStats = useSetAtom(strategyPerpetualStatsAtom);
  const setStrategyPerpetualStaticInfo = useSetAtom(perpetualStrategyStaticInfoAtom);
  const traderAPI = useAtomValue(traderAPIAtom);

  const requestSentRef = useRef(false);

  useEffect(() => {
    if (pools.length) {
      const foundPool = pools.find((pool) => pool.poolSymbol === STRATEGY_POOL_SYMBOL);
      if (foundPool) {
        setStrategyPool(foundPool);
        const foundPerpetual = foundPool.perpetuals.find(
          (perpetual) =>
            perpetual.baseCurrency === STRATEGY_BASE_CURRENCY && perpetual.quoteCurrency === STRATEGY_QUOTE_CURRENCY
        );
        if (foundPerpetual) {
          setStrategyPerpetual(foundPerpetual);
          setStrategyPerpetualStats({
            ...foundPerpetual,
            poolName: foundPool.poolSymbol,
          });
        } else {
          setStrategyPerpetual(null);
        }
        return;
      }
    }
    setStrategyPool(null);
    setStrategyPerpetual(null);
  }, [pools, setStrategyPool, setStrategyPerpetual, setStrategyPerpetualStats]);

  useEffect(() => {
    const strategyPerpetualStats = allPerpetualStatistics[STRATEGY_SYMBOL];
    if (strategyPerpetualStats) {
      setStrategyPerpetualStats(strategyPerpetualStats);
    }
  }, [allPerpetualStatistics, setStrategyPerpetualStats]);

  useEffect(() => {
    if (requestSentRef.current) {
      return;
    }

    if (!STRATEGY_SYMBOL) {
      setStrategyPerpetualStaticInfo(null);
      return;
    }

    requestSentRef.current = true;

    getPerpetualStaticInfo(getEnabledChainId(chainId, location.hash), traderAPI, STRATEGY_SYMBOL)
      .then(({ data }) => {
        if (data.error) {
          throw new Error(data.error);
        } else {
          setStrategyPerpetualStaticInfo(data);
        }
      })
      .catch((error) => {
        console.error(error);
        setStrategyPerpetualStaticInfo(null);
      })
      .finally(() => {
        requestSentRef.current = false;
      });

    return () => {
      requestSentRef.current = false;
    };
  }, [chainId, setStrategyPerpetualStaticInfo, traderAPI, location]);

  return (
    <>
      <Helmet title="Strategies | D8X App" />
      <div className={styles.root}>
        <MaintenanceWrapper>
          <Container className={styles.container}>
            {activeStrategyWallet != null &&
            address &&
            strategyAddresses.some(
              ({ userAddress, strategyAddress }) =>
                userAddress === address.toLowerCase() &&
                strategyAddress.toLowerCase() === activeStrategyWallet.account?.address?.toLowerCase()
            ) ? (
              <StrategyBlock strategyClient={activeStrategyWallet} />
            ) : (
              <ConnectBlock />
            )}
          </Container>
        </MaintenanceWrapper>

        <StrategyPoolSubscription />
      </div>
    </>
  );
};

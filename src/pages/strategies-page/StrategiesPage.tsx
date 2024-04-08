import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

import { STRATEGY_BASE_CURRENCY, STRATEGY_POOL_SYMBOL, STRATEGY_QUOTE_CURRENCY, STRATEGY_SYMBOL } from 'appConstants';
import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { allPerpetualStatisticsPrimitiveAtom, poolsAtom } from 'store/pools.store';
import {
  strategyAddressesAtom,
  strategyPerpetualAtom,
  strategyPerpetualStatsAtom,
  strategyPoolAtom,
} from 'store/strategies.store';

import { ConnectBlock } from './components/connect-block/ConnectBlock';
import { StrategyBlock } from './components/strategy-block/StrategyBlock';

import styles from './StrategiesPage.module.scss';

export const StrategiesPage = () => {
  const { address } = useAccount();

  const pools = useAtomValue(poolsAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const allPerpetualStatistics = useAtomValue(allPerpetualStatisticsPrimitiveAtom);
  const setStrategyPool = useSetAtom(strategyPoolAtom);
  const setStrategyPerpetual = useSetAtom(strategyPerpetualAtom);
  const setStrategyPerpetualStats = useSetAtom(strategyPerpetualStatsAtom);

  useEffect(() => {
    if (pools.length) {
      const foundPool = pools.find((pool) => pool.poolSymbol === STRATEGY_POOL_SYMBOL);
      if (foundPool) {
        setStrategyPool(foundPool);
        const foundPerpetual = foundPool.perpetuals.find(
          (perpetual) =>
            perpetual.baseCurrency === STRATEGY_BASE_CURRENCY && perpetual.quoteCurrency === STRATEGY_QUOTE_CURRENCY
        );
        setStrategyPerpetual(foundPerpetual || null);
        return;
      }
    }
    setStrategyPool(null);
    setStrategyPerpetual(null);
  }, [pools, setStrategyPool, setStrategyPerpetual]);

  useEffect(() => {
    const strategyPerpetualStats = allPerpetualStatistics[STRATEGY_SYMBOL];
    setStrategyPerpetualStats(strategyPerpetualStats || null);
  }, [allPerpetualStatistics, setStrategyPerpetualStats]);

  return (
    <>
      <Helmet title="Strategies | D8X App" />
      <div className={styles.root}>
        <MaintenanceWrapper>
          <Container className={styles.container}>
            {address && strategyAddresses.some(({ userAddress }) => userAddress === address.toLowerCase()) ? (
              <StrategyBlock />
            ) : (
              <ConnectBlock />
            )}
          </Container>
        </MaintenanceWrapper>
      </div>
    </>
  );
};

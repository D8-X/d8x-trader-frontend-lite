import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useLocation } from 'react-router-dom';

import { Button } from '@mui/material';

import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { getWeeklyAPY } from 'network/history';
import { getAngleAPY, getEtherFiAPY } from 'network/network';
import { clearInputsDataAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { liquidityTypeAtom, triggerAddInputFocusAtom, triggerUserStatsUpdateAtom } from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';
import { getEnabledChainId } from 'utils/getEnabledChainId';
import type { PoolWithIdI } from 'types/types';
import { LiquidityTypeE } from 'types/enums';

import { DataColumn } from '../data-column/DataColumn';
import type { DataItemI } from '../data-column/types';

import D8XLogo from '../../assets/d8xLogo.svg?react';
import D8XExchangeTurtleLogo from '../../assets/d8xExchangeTurtleLogo.svg?react';
import { boostsPerSymbol } from '../../data/boostsPerSymbol';
import { yieldsPerSymbol } from '../../data/yieldsPerSymbol';

import styles from './PoolCard.module.scss';

interface PoolCardPropsI {
  pool: PoolWithIdI;
}

export const PoolCard = memo(({ pool }: PoolCardPropsI) => {
  const { t } = useTranslation();

  const { chainId } = useAccount();
  const location = useLocation();

  const setSelectedPerpetual = useSetAtom(selectedPerpetualAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);
  const setSelectedPool = useSetAtom(selectedPoolAtom);
  const setTriggerAddInputFocus = useSetAtom(triggerAddInputFocusAtom);
  const setLiquidityType = useSetAtom(liquidityTypeAtom);
  const triggerUserStatsUpdate = useAtomValue(triggerUserStatsUpdateAtom);

  const [weeklyAPY, setWeeklyAPY] = useState<number>();
  const [stUsdAPY, setStUsdAPY] = useState<number>();
  const [weethAPY, setWeethAPY] = useState<string>();

  const weeklyAPYRequestSentRef = useRef(false);
  const stUsdAPYRequestSentRef = useRef(false);
  const weethAPYRequestSentRef = useRef(false);

  useEffect(() => {
    if (weeklyAPYRequestSentRef.current) {
      return;
    }

    weeklyAPYRequestSentRef.current = true;
    getWeeklyAPY(getEnabledChainId(chainId, location.hash), pool.poolSymbol)
      .then((data) => {
        setWeeklyAPY(data.allTimeAPY * 100);
      })
      .catch((error) => {
        console.error(error);
        setWeeklyAPY(undefined);
      })
      .finally(() => {
        weeklyAPYRequestSentRef.current = false;
      });

    return () => {
      weeklyAPYRequestSentRef.current = false;
    };
  }, [chainId, pool.poolSymbol, triggerUserStatsUpdate, location]);

  useEffect(() => {
    if (stUsdAPYRequestSentRef.current || pool.poolSymbol !== 'STUSD') {
      return;
    }

    stUsdAPYRequestSentRef.current = true;
    getAngleAPY()
      .then(({ apyDec }) => {
        setStUsdAPY(+(Number(apyDec) * 100).toFixed(2));
      })
      .catch((error) => {
        console.error(error);
        setStUsdAPY(undefined);
      })
      .finally(() => {
        stUsdAPYRequestSentRef.current = false;
      });

    return () => {
      stUsdAPYRequestSentRef.current = false;
    };
  }, [pool.poolSymbol, triggerUserStatsUpdate]);

  useEffect(() => {
    if (weethAPYRequestSentRef.current || pool.poolSymbol !== 'WEETH') {
      return;
    }

    weethAPYRequestSentRef.current = true;

    getEtherFiAPY()
      .then(({ etherfiApy }) => {
        setWeethAPY(Number(etherfiApy).toFixed(2));
      })
      .catch((error) => {
        console.error(error);
        setWeethAPY(undefined);
      })
      .finally(() => {
        weethAPYRequestSentRef.current = false;
      });

    return () => {
      weethAPYRequestSentRef.current = false;
    };
  }, [pool.poolSymbol, triggerUserStatsUpdate]);

  const yieldData = useMemo(() => {
    const yields: DataItemI[] = [];
    yields.push({
      title: t('pages.vault.pool-card.yields.trading-api', {
        percent: weeklyAPY !== undefined ? formatToCurrency(weeklyAPY, '', true, 2) : '-',
      }),
      logo: <D8XLogo />,
      logoBackground: 'transparent',
    });
    if (yieldsPerSymbol[pool.poolSymbol] && yieldsPerSymbol[pool.poolSymbol].length > 0) {
      yieldsPerSymbol[pool.poolSymbol].map((dataItem) => {
        yields.push({
          title: t(`pages.vault.pool-card.yields.${dataItem.translationKey}`, dataItem.label, { stUsdAPY, weethAPY }),
          logo: dataItem.logo,
          isRounded: dataItem.isRounded,
          logoBackground: dataItem.logoBackground,
        });
      });
    }
    yields.push({
      title: t('pages.vault.pool-card.yields.d8x-points'),
      logo: <D8XLogo />,
      logoBackground: 'transparent',
    });
    return yields;
  }, [t, weeklyAPY, stUsdAPY, weethAPY, pool.poolSymbol]);

  const boostsData = useMemo(() => {
    const boosts: DataItemI[] = [];
    if (boostsPerSymbol[pool.poolSymbol] && boostsPerSymbol[pool.poolSymbol].length > 0) {
      boostsPerSymbol[pool.poolSymbol].map((dataItem) => {
        boosts.push({
          title: t(`pages.vault.pool-card.boosts.${dataItem.translationKey}`, dataItem.label),
          logo: dataItem.logo,
          isRounded: dataItem.isRounded,
          logoBackground: dataItem.logoBackground,
        });
      });
    }
    boosts.push({
      title: t('pages.vault.pool-card.boosts.turtle-d8x-points'),
      logo: <D8XExchangeTurtleLogo />,
      logoBackground: 'transparent',
    });
    return boosts;
  }, [t, pool.poolSymbol]);

  const handleClick = () => {
    setSelectedPool(pool.poolSymbol);
    setSelectedPerpetual(pool.perpetuals[0].id);
    setLiquidityType(LiquidityTypeE.Add);
    setTriggerAddInputFocus((prevState) => !prevState);
    clearInputsData();
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <DynamicLogo logoName={pool.settleSymbol.toLowerCase()} width={80} height={80} />
        </div>
        <div className={styles.symbol}>
          {pool.settleSymbol} {t('pages.vault.pool-card.vault')}
        </div>
      </div>
      <div className={styles.content}>
        <DataColumn title={t('pages.vault.pool-card.yields.title')} items={yieldData} />
        <DataColumn
          title={t('pages.vault.pool-card.boosts.title')}
          titleLink="https://turtle.club/dashboard/?ref=D8X"
          items={boostsData}
        />
      </div>
      <div className={styles.action}>
        <Button onClick={handleClick} className={styles.button} variant="primary">
          {t('pages.vault.pool-card.deposit-button')}
        </Button>
      </div>
    </div>
  );
});

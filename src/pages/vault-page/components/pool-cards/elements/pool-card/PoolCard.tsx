import { useAtomValue, useSetAtom } from 'jotai';
import { memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Button } from '@mui/material';

import { getWeeklyAPI } from 'network/history';
import { clearInputsDataAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { liquidityTypeAtom, triggerAddInputFocusAtom, triggerUserStatsUpdateAtom } from 'store/vault-pools.store';
import { getDynamicLogo } from 'utils/getDynamicLogo';
import { formatToCurrency } from 'utils/formatToCurrency';
import { getEnabledChainId } from 'utils/getEnabledChainId';
import type { PoolWithIdI, TemporaryAnyT } from 'types/types';
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

  const setSelectedPerpetual = useSetAtom(selectedPerpetualAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);
  const setSelectedPool = useSetAtom(selectedPoolAtom);
  const setTriggerAddInputFocus = useSetAtom(triggerAddInputFocusAtom);
  const setLiquidityType = useSetAtom(liquidityTypeAtom);
  const triggerUserStatsUpdate = useAtomValue(triggerUserStatsUpdateAtom);

  const [weeklyAPI, setWeeklyAPI] = useState<number>();

  const weeklyApiRequestSentRef = useRef(false);

  useEffect(() => {
    if (weeklyApiRequestSentRef.current) {
      return;
    }

    weeklyApiRequestSentRef.current = true;
    getWeeklyAPI(getEnabledChainId(chainId), pool.poolSymbol)
      .then((data) => {
        setWeeklyAPI(data.allTimeAPY * 100);
      })
      .catch((error) => {
        console.error(error);
        setWeeklyAPI(undefined);
      })
      .finally(() => {
        weeklyApiRequestSentRef.current = false;
      });
  }, [chainId, pool.poolSymbol, triggerUserStatsUpdate]);

  const yieldData = useMemo(() => {
    const yields: DataItemI[] = [];
    yields.push({
      title: t('pages.vault.pool-card.yields.trading-api', {
        percent: weeklyAPI !== undefined ? formatToCurrency(weeklyAPI, '', true, 2) : '-',
      }),
      logo: <D8XLogo />,
      logoBackground: 'transparent',
    });
    if (yieldsPerSymbol[pool.poolSymbol] && yieldsPerSymbol[pool.poolSymbol].length > 0) {
      yieldsPerSymbol[pool.poolSymbol].map((dataItem) => {
        yields.push({
          title: t(`pages.vault.pool-card.yields.${dataItem.translationKey}`, dataItem.label),
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
  }, [t, weeklyAPI, pool.poolSymbol]);

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

  const IconComponent = getDynamicLogo(pool.poolSymbol.toLowerCase()) as TemporaryAnyT;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Suspense fallback={null}>
            <IconComponent width={80} height={80} />
          </Suspense>
        </div>
        <div className={styles.symbol}>
          {pool.poolSymbol} {t('pages.vault.pool-card.vault')}
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

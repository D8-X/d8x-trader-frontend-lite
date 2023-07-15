import { useAtom } from 'jotai';
import { useEffect, useMemo /*, useRef, useState*/ } from 'react';
/*import { useChainId } from 'wagmi';*/

/*import { PERIOD_OF_7_DAYS } from 'app-constants';*/
import type { StatDataI } from 'components/stats-line/types';
import { StatsLine } from 'components/stats-line/StatsLine';
/*import { getWeeklyAPI } from 'network/history';*/
import { formatToCurrency } from 'utils/formatToCurrency';
import {
  dCurrencyPriceAtom,
  tvlAtom,
  selectedLiquidityPoolAtom,
  loadStatsAtom,
  sdkConnectedAtom,
} from 'store/vault-pools.store';
import { traderAPIAtom } from 'store/pools.store';

export const GlobalStats = () => {
  /*const chainId = useChainId();*/

  const [selectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [dCurrencyPrice, setDCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [tvl, setTvl] = useAtom(tvlAtom);
  const [loadStats] = useAtom(loadStatsAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);

  /*const [weeklyAPI, setWeeklyAPI] = useState<number>();

  const weeklyApiRequestSentRef = useRef(false);

  useEffect(() => {
    if (!loadStats) {
      return;
    }

    if (!chainId || !selectedLiquidityPool) {
      setWeeklyAPI(undefined);
      return;
    }

    if (weeklyApiRequestSentRef.current) {
      return;
    }

    const fromTimestamp = Math.floor((Date.now() - PERIOD_OF_7_DAYS) / 1000);
    const toTimestamp = Math.floor(Date.now() / 1000);

    weeklyApiRequestSentRef.current = true;
    getWeeklyAPI(chainId, fromTimestamp, toTimestamp, selectedLiquidityPool.poolSymbol)
      .then((data) => {
        setWeeklyAPI(data.apy * 100);
      })
      .finally(() => {
        weeklyApiRequestSentRef.current = false;
      });
  }, [chainId, selectedLiquidityPool, loadStats]);*/

  useEffect(() => {
    if (!loadStats) {
      return;
    }
    setDCurrencyPrice(null);
    if (traderAPI && isSDKConnected && selectedLiquidityPool) {
      traderAPI.getShareTokenPrice(selectedLiquidityPool.poolSymbol).then((price) => setDCurrencyPrice(price));
    }
  }, [traderAPI, selectedLiquidityPool, loadStats, isSDKConnected, setDCurrencyPrice]);

  useEffect(() => {
    if (!loadStats) {
      return;
    }
    setTvl(null);
    if (traderAPI && isSDKConnected && selectedLiquidityPool) {
      traderAPI
        .getPoolState(selectedLiquidityPool.poolSymbol)
        .then((PoolState) => setTvl(PoolState.pnlParticipantCashCC));
    }
  }, [traderAPI, selectedLiquidityPool, loadStats, isSDKConnected, setTvl]);

  const dSupply = useMemo(() => {
    if (selectedLiquidityPool && dCurrencyPrice && tvl) {
      return formatToCurrency(tvl / dCurrencyPrice, `d${selectedLiquidityPool?.poolSymbol}`, true);
    }
    return '--';
  }, [selectedLiquidityPool, dCurrencyPrice, tvl]);

  const items: StatDataI[] = useMemo(
    () => [
      /*{
        id: 'weeklyAPY',
        label: 'Weekly APY',
        value: weeklyAPI !== undefined ? formatToCurrency(weeklyAPI, '%', true, 2) : '--',
      },*/
      {
        id: 'tvl',
        label: 'TVL',
        value:
          selectedLiquidityPool && tvl != null ? formatToCurrency(tvl, selectedLiquidityPool.poolSymbol, true) : '--',
      },
      {
        id: 'dSymbolPrice',
        label: `d${selectedLiquidityPool?.poolSymbol} Price`,
        value:
          dCurrencyPrice != null ? formatToCurrency(dCurrencyPrice, selectedLiquidityPool?.poolSymbol, true) : '--',
      },
      {
        id: 'dSymbolSupply',
        label: `d${selectedLiquidityPool?.poolSymbol} Supply`,
        value: dSupply,
      },
    ],
    [/*weeklyAPI,*/ selectedLiquidityPool, tvl, dCurrencyPrice, dSupply]
  );

  return <StatsLine items={items} />;
};

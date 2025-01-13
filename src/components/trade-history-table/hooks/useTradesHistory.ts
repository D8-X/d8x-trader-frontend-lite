import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';

import { getTradesHistory } from 'network/history';
import {
  collateralToSettleConversionAtom,
  openOrdersAtom,
  allPerpetualsAtom,
  tradesHistoryAtom,
} from 'store/pools.store';
import type { TradeHistoryWithSymbolDataI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

export const useTradesHistory = () => {
  const { address, isConnected, chainId } = useAccount();

  const [tradesHistory, setTradesHistory] = useAtom(tradesHistoryAtom);
  const openOrders = useAtomValue(openOrdersAtom);
  const perpetuals = useAtomValue(allPerpetualsAtom);
  const c2s = useAtomValue(collateralToSettleConversionAtom);

  const updateTradesHistoryRef = useRef(false);

  const refreshTradesHistory = useCallback(() => {
    if (updateTradesHistoryRef.current) {
      return;
    }
    if (!address || !isConnected || !isEnabledChain(chainId)) {
      setTradesHistory([]);
      return;
    }

    updateTradesHistoryRef.current = true;
    getTradesHistory(chainId, address)
      .then((data) => {
        setTradesHistory(data.length > 0 ? data : []);
      })
      .catch(console.error)
      .finally(() => {
        updateTradesHistoryRef.current = false;
      });
  }, [chainId, address, isConnected, setTradesHistory]);

  useEffect(() => {
    refreshTradesHistory();

    return () => {
      updateTradesHistoryRef.current = false;
    };
  }, [openOrders, refreshTradesHistory]);

  const tradesHistoryWithSymbol: TradeHistoryWithSymbolDataI[] = useMemo(() => {
    return tradesHistory.map((tradeHistory) => {
      const perpetual = perpetuals.find(({ id }) => id === tradeHistory.perpetualId);
      const settleSymbol = perpetual?.poolName ? (c2s.get(perpetual?.poolName)?.settleSymbol ?? '') : '';
      return {
        ...tradeHistory,
        symbol: perpetual ? `${perpetual.baseCurrency}/${perpetual.quoteCurrency}/${settleSymbol}` : '',
        settleSymbol,
        perpetual: perpetual ?? null,
      };
    });
  }, [tradesHistory, perpetuals, c2s]);

  return {
    tradesHistory: tradesHistoryWithSymbol,
    refreshTradesHistory,
  };
};

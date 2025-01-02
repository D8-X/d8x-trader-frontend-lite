import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { INVALID_PERPETUAL_STATES } from 'appConstants';
import type { SelectItemI } from 'components/header/elements/header-select/types';
import { createSymbol } from 'helpers/createSymbol';
import { calculateProbability } from 'helpers/calculateProbability';
import { AssetTypeE, OrderBlockE } from 'types/enums';
import { orderBlockAtom } from 'store/order-block.store';
import { poolsAtom, traderAPIAtom } from 'store/pools.store';
import { marketsDataAtom } from 'store/tv-chart.store';

import { PerpetualWithPoolAndMarketI } from '../types';

export const useMarkets = () => {
  const marketsData = useAtomValue(marketsDataAtom);
  const pools = useAtomValue(poolsAtom);
  const orderBlock = useAtomValue(orderBlockAtom);
  const traderAPI = useAtomValue(traderAPIAtom);

  return useMemo(() => {
    const marketsList: SelectItemI<PerpetualWithPoolAndMarketI>[] = [];
    pools
      .filter((pool) => pool.isRunning)
      .forEach((pool) =>
        marketsList.push(
          ...pool.perpetuals
            .filter((perpetual) => !INVALID_PERPETUAL_STATES.includes(perpetual.state))
            .map((perpetual) => {
              const pairId = `${perpetual.baseCurrency}-${perpetual.quoteCurrency}`.toLowerCase();
              let marketData = marketsData.find((market) => market.symbol === pairId);

              const symbol = createSymbol({
                poolSymbol: pool.poolSymbol,
                baseCurrency: perpetual.baseCurrency,
                quoteCurrency: perpetual.quoteCurrency,
              });

              let isPredictionMarket = false;
              try {
                isPredictionMarket = traderAPI?.isPredictionMarket(symbol) || false;
              } catch (error) {
                // skip
              }

              if (!marketData && isPredictionMarket) {
                const currentPx = calculateProbability(perpetual.midPrice, orderBlock === OrderBlockE.Short);

                marketData = {
                  isOpen: !perpetual.isMarketClosed,
                  symbol: pairId,
                  assetType: AssetTypeE.Prediction,
                  ret24hPerc: 0,
                  currentPx,
                  nextOpen: 0,
                  nextClose: 0,
                };
              }

              return {
                value: perpetual.id.toString(),
                item: {
                  ...perpetual,
                  poolSymbol: pool.poolSymbol,
                  settleSymbol: pool.settleSymbol,
                  symbol,
                  marketData: marketData ?? null,
                },
              };
            })
        )
      );
    return marketsList;

    // .filter((market) => {
    //   return (
    //     market.item.state === 'NORMAL' ||
    //     (market.item.marketData?.assetType === AssetTypeE.Prediction &&
    //       ['NORMAL', 'EMERGENCY', 'SETTLE', 'CLEARED'].includes(market.item.state))
    //   );
    // });
  }, [pools, marketsData, orderBlock, traderAPI]);
};

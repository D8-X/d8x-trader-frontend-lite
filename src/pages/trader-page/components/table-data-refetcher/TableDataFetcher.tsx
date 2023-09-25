import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useState } from 'react';
import { type Address, useAccount, useChainId } from 'wagmi';

import { getOpenOrders, getPositionRisk } from 'network/network';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import { clearOpenOrdersAtom, openOrdersAtom, positionsAtom, traderAPIAtom } from 'store/pools.store';

const MAX_FETCH_COUNT = 20;
const MAX_FETCH_TIME = 40 * 1000;
const INTERVAL_FOR_TICKER = 2000;

export const TableDataFetcher = memo(() => {
  const { address } = useAccount();
  const chainId = useChainId();

  const [latestOrderSentTimestamp] = useAtom(latestOrderSentTimestampAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const clearOpenOrders = useSetAtom(clearOpenOrdersAtom);
  const setOpenOrders = useSetAtom(openOrdersAtom);
  const setPositions = useSetAtom(positionsAtom);

  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (Date.now() - latestOrderSentTimestamp <= MAX_FETCH_TIME) {
      setTicker(1);
      intervalId = setInterval(() => {
        setTicker((prevState) => {
          if (prevState >= MAX_FETCH_COUNT) {
            clearInterval(intervalId);
            return 0;
          }
          return prevState + 1;
        });
      }, INTERVAL_FOR_TICKER);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [latestOrderSentTimestamp]);

  useEffect(() => {
    if (ticker > 0 && chainId && traderAPI && address) {
      getOpenOrders(chainId, traderAPI, address as Address)
        .then(({ data: d }) => {
          clearOpenOrders();
          if (d?.length > 0) {
            d.map(setOpenOrders);
          }
        })
        .catch(console.error);
      getPositionRisk(chainId, traderAPI, address as Address, Date.now())
        .then(({ data }) => {
          if (data && data.length > 0) {
            data.map(setPositions);
          }
        })
        .catch(console.error);
    }
  }, [ticker, chainId, traderAPI, address, setPositions, setOpenOrders, clearOpenOrders]);

  return null;
});

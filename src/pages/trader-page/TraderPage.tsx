import { useAtom, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import { Box, useMediaQuery, useTheme } from '@mui/material';

import { Container } from 'components/container/Container';
import { CollateralsSelect } from 'components/header/elements/collaterals-select/CollateralsSelect';
import { PerpetualsSelect } from 'components/header/elements/perpetuals-select/PerpetualsSelect';
import { Header } from 'components/header/Header';
import { Footer } from 'components/footer/Footer';
import { FundingTable } from 'components/funding-table/FundingTable';
import { OpenOrdersTable } from 'components/open-orders-table/OpenOrdersTable';
import { OrderBlock } from 'components/order-block/OrderBlock';
import { PositionsTable } from 'components/positions-table/PositionsTable';
import { TradeHistoryTable } from 'components/trade-history-table/TradeHistoryTable';
import { SelectorItemI, TableSelector } from 'components/table-selector/TableSelector';
import { TableSelectorMobile } from 'components/table-selector-mobile/TableSelectorMobile';
import { getOpenOrders, getPositionRisk, getTradingFee } from 'network/network';
import { ChartHolder } from 'pages/trader-page/components/chart-holder/ChartHolder';
import { PerpetualStats } from 'pages/trader-page/components/perpetual-stats/PerpetualStats';
import {
  openOrdersAtom,
  perpetualStatisticsAtom,
  poolFeeAtom,
  positionsAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { TableTypeE } from 'types/enums';
import type { AddressT } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './TraderPage.module.scss';

export const TraderPage = memo(() => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isBigScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeAllIndex, setActiveAllIndex] = useState(0);
  const [activePositionIndex, setActivePositionIndex] = useState(0);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(0);

  const fetchPositionsRef = useRef(false);
  const fetchOrdersRef = useRef(false);
  const fetchFeeRef = useRef(false);
  const isPageUrlAppliedRef = useRef(false);

  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [positions, setPositions] = useAtom(positionsAtom);
  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const setPoolFee = useSetAtom(poolFeeAtom);

  const chainId = useChainId();
  const { address } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPositions = useCallback(
    async (_chainId: number, _poolSymbol: string, _address: AddressT) => {
      if (!traderAPI || traderAPI.chainId !== _chainId || !isSDKConnected || fetchPositionsRef.current) {
        return;
      }
      fetchPositionsRef.current = true;
      await getPositionRisk(_chainId, traderAPI, _poolSymbol, _address)
        .then(({ data }) => {
          if (data && data.length > 0) {
            data.map((p) => setPositions(p));
          }
          fetchFeeRef.current = false;
        })
        .catch((err) => {
          console.error(err);
          fetchPositionsRef.current = false;
        });
    },
    [traderAPI, isSDKConnected, setPositions]
  );

  const fetchOrders = useCallback(
    async (_chainId: number, _poolSymbol: string, _address: AddressT) => {
      if (!traderAPI || traderAPI.chainId !== _chainId || !isSDKConnected || fetchOrdersRef.current) {
        return;
      }
      fetchOrdersRef.current = true;
      await getOpenOrders(_chainId, traderAPI, _poolSymbol, _address)
        .then(({ data }) => {
          if (data && data.length > 0) {
            data.map((orders) => setOpenOrders(orders));
          }
          fetchFeeRef.current = false;
        })
        .catch((err) => {
          console.error(err);
          fetchOrdersRef.current = false;
        });
    },
    [traderAPI, isSDKConnected, setOpenOrders]
  );

  const fetchFee = useCallback(
    async (_chainId: number, _poolSymbol: string, _address: string) => {
      if (fetchFeeRef.current) {
        return;
      }
      fetchFeeRef.current = true;
      setPoolFee(undefined);
      getTradingFee(_chainId, _poolSymbol, _address)
        .then(({ data }) => {
          setPoolFee(data);
          fetchFeeRef.current = false;
        })
        .catch((error) => {
          console.error(error);
          fetchFeeRef.current = false;
        });
    },
    [setPoolFee]
  );

  useEffect(() => {
    if (location.hash || !selectedPool || selectedPool.perpetuals.length < 1 || isPageUrlAppliedRef.current) {
      return;
    }

    isPageUrlAppliedRef.current = true;
    navigate(
      `${location.pathname}${location.search}#${selectedPool.perpetuals[0].baseCurrency}-${selectedPool.perpetuals[0].quoteCurrency}-${selectedPool.poolSymbol}`
    );
  }, [selectedPool, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!chainId || !selectedPool?.poolSymbol || !address) {
      return;
    }
    fetchPositions(chainId, selectedPool.poolSymbol, address).then();
    fetchOrders(chainId, selectedPool?.poolSymbol, address).then();
    fetchFee(chainId, selectedPool.poolSymbol, address).then();
  }, [chainId, selectedPool, address, fetchPositions, fetchOrders, fetchFee]);

  useEffect(() => {
    fetchOrdersRef.current = selectedPool?.poolSymbol === undefined;
    fetchPositionsRef.current = selectedPool?.poolSymbol === undefined;
    fetchFeeRef.current = selectedPool?.poolSymbol === undefined;
  });

  const positionItems: SelectorItemI[] = useMemo(
    () => [
      {
        label: `${t('pages.trade.positions-table.table-title')} (` + positions.length + `)`,
        item: <PositionsTable />,
        tableType: TableTypeE.POSITIONS,
      },
      {
        label: `${t('pages.trade.orders-table.table-title')} (` + openOrders.length + `)`,
        item: <OpenOrdersTable />,
        tableType: TableTypeE.OPEN_ORDERS,
      },
    ],
    [positions, openOrders, t]
  );

  const historyItems: SelectorItemI[] = useMemo(
    () => [
      {
        label: `${t('pages.trade.history-table.table-title')}`,
        item: <TradeHistoryTable />,
        tableType: TableTypeE.TRADE_HISTORY,
      },
      {
        label: `${t('pages.trade.funding-table.table-title')}`,
        item: <FundingTable />,
        tableType: TableTypeE.FUNDING,
      },
    ],
    [t]
  );

  const selectorForAllItems: SelectorItemI[] = useMemo(
    () => [...positionItems, ...historyItems],
    [positionItems, historyItems]
  );

  const handleActiveAllIndex = useCallback(
    (index: number) => {
      setActiveAllIndex(index);

      const firstTableItems = positionItems.length;
      if (index < firstTableItems) {
        setActivePositionIndex(index);
      } else {
        setActiveHistoryIndex(index - firstTableItems);
      }
    },
    [positionItems]
  );

  const handlePositionsIndex = useCallback((index: number) => {
    setActiveAllIndex(index);
    setActivePositionIndex(index);
  }, []);

  const handleHistoryIndex = useCallback(
    (index: number) => {
      setActiveAllIndex(index + positionItems.length);
      setActiveHistoryIndex(index);
    },
    [positionItems]
  );

  return (
    <>
      <Helmet>
        <title>
          {`${
            perpetualStatistics
              ? formatToCurrency(
                  perpetualStatistics.midPrice,
                  `${perpetualStatistics.baseCurrency}-${perpetualStatistics.quoteCurrency}`,
                  true
                )
              : ''
          } | D8X App`}
        </title>
      </Helmet>
      <Box className={styles.root}>
        <Header>
          <CollateralsSelect withNavigate={true} />
          <PerpetualsSelect withNavigate={true} />
        </Header>
        {isBigScreen && (
          <Container className={styles.sidesContainer}>
            <Box className={styles.leftBlock}>
              <PerpetualStats />
              <ChartHolder />
              <TableSelector
                selectorItems={selectorForAllItems}
                activeIndex={activeAllIndex}
                setActiveIndex={handleActiveAllIndex}
              />
            </Box>
            <Box className={styles.rightBlock}>
              <OrderBlock />
            </Box>
          </Container>
        )}
        {!isBigScreen && (
          <Container className={styles.columnContainer}>
            <PerpetualStats />
            <ChartHolder />
            <OrderBlock />
            {isMobile ? (
              <TableSelectorMobile selectorItems={selectorForAllItems} />
            ) : (
              <>
                <TableSelector
                  selectorItems={positionItems}
                  activeIndex={activePositionIndex}
                  setActiveIndex={handlePositionsIndex}
                />
                <TableSelector
                  selectorItems={historyItems}
                  activeIndex={activeHistoryIndex}
                  setActiveIndex={handleHistoryIndex}
                />
              </>
            )}
          </Container>
        )}
        <Footer />
      </Box>
    </>
  );
});

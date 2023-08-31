import classnames from 'classnames';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount, useChainId, type Address } from 'wagmi';

import { Box, useMediaQuery, useTheme } from '@mui/material';

import { Container } from 'components/container/Container';
import { Footer } from 'components/footer/Footer';
import { FundingTable } from 'components/funding-table/FundingTable';
import { Header } from 'components/header/Header';
import { CollateralsSelect } from 'components/header/elements/collaterals-select/CollateralsSelect';
import { MarketSelect } from 'components/header/elements/market-select/MarketSelect';
import { PerpetualsSelect } from 'components/header/elements/perpetuals-select/PerpetualsSelect';
import { Helmet } from 'components/helmet/Helmet';
import { OpenOrdersTable } from 'components/open-orders-table/OpenOrdersTable';
import { OrderBlock } from 'components/order-block/OrderBlock';
import { PositionsTable } from 'components/positions-table/PositionsTable';
import { TableSelectorMobile } from 'components/table-selector-mobile/TableSelectorMobile';
import { TableSelector, type SelectorItemI } from 'components/table-selector/TableSelector';
import { TradeHistoryTable } from 'components/trade-history-table/TradeHistoryTable';
import { getOpenOrders, getPositionRisk, getTradingFee } from 'network/network';
import { ChartHolder } from 'pages/trader-page/components/chart-holder/ChartHolder';
import { PerpetualStats } from 'pages/trader-page/components/perpetual-stats/PerpetualStats';
import { orderBlockPositionAtom } from 'store/app.store';
import {
  openOrdersAtom,
  perpetualStatisticsAtom,
  poolFeeAtom,
  positionsAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { OrderBlockPositionE, TableTypeE } from 'types/enums';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './TraderPage.module.scss';

export const TraderPage = () => {
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

  const [orderBlockPosition] = useAtom(orderBlockPositionAtom);
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
    async (_chainId: number, _poolSymbol: string, _address: Address) => {
      if (!traderAPI || traderAPI.chainId !== _chainId || !isSDKConnected || fetchPositionsRef.current) {
        return;
      }
      fetchPositionsRef.current = true;
      try {
        const { data } = await getPositionRisk(_chainId, traderAPI, _poolSymbol, _address);
        data.map(setPositions);
      } catch (err) {
        console.error(err);
      } finally {
        fetchPositionsRef.current = false;
      }
    },
    [traderAPI, isSDKConnected, setPositions]
  );

  const fetchOrders = useCallback(
    async (_chainId: number, _poolSymbol: string, _address: Address) => {
      if (!traderAPI || traderAPI.chainId !== _chainId || !isSDKConnected || fetchOrdersRef.current) {
        return;
      }
      fetchOrdersRef.current = true;
      try {
        const { data } = await getOpenOrders(_chainId, traderAPI, _poolSymbol, _address);
        data.map(setOpenOrders);
      } catch (err) {
        console.error(err);
      } finally {
        fetchOrdersRef.current = false;
      }
    },
    [traderAPI, isSDKConnected, setOpenOrders]
  );

  const fetchFee = useCallback(
    async (_chainId: number, _poolSymbol: string, _address: Address) => {
      if (fetchFeeRef.current) {
        return;
      }
      fetchFeeRef.current = true;
      setPoolFee(undefined);
      try {
        const { data } = await getTradingFee(_chainId, _poolSymbol, _address);
        setPoolFee(data);
      } catch (err) {
        console.error(err);
      } finally {
        fetchFeeRef.current = false;
      }
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
    fetchPositions(chainId, selectedPool.poolSymbol, address);
    fetchOrders(chainId, selectedPool?.poolSymbol, address);
    fetchFee(chainId, selectedPool.poolSymbol, address);
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
      <Helmet
        title={`${
          perpetualStatistics
            ? formatToCurrency(
                perpetualStatistics.midPrice,
                `${perpetualStatistics.baseCurrency}-${perpetualStatistics.quoteCurrency}`,
                true
              )
            : ''
        } | D8X App`}
      />
      <Box className={styles.root}>
        <Header>
          <CollateralsSelect withNavigate={true} />
          <PerpetualsSelect withNavigate={true} />
          {!isBigScreen && <MarketSelect />}
        </Header>
        {isBigScreen && (
          <Container
            className={classnames(styles.sidesContainer, {
              [styles.swapSides]: orderBlockPosition === OrderBlockPositionE.Left,
            })}
          >
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
              <MarketSelect />
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
};

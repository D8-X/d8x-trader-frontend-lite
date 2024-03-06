import classnames from 'classnames';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { type Address, useAccount, useBalance, useChainId } from 'wagmi';

import { Box, useMediaQuery, useTheme } from '@mui/material';

import { Container } from 'components/container/Container';
import { FundingTable } from 'components/funding-table/FundingTable';
import { MarketSelect } from 'components/header/elements/market-select/MarketSelect';
import { Helmet } from 'components/helmet/Helmet';
import { OpenOrdersTable } from 'components/open-orders-table/OpenOrdersTable';
import { OrderBlock } from 'components/order-block/OrderBlock';
import { PositionsTable } from 'components/positions-table/PositionsTable';
import { TableSelectorMobile } from 'components/table-selector-mobile/TableSelectorMobile';
import { type SelectorItemI, TableSelector } from 'components/table-selector/TableSelector';
import { TradeHistoryTable } from 'components/trade-history-table/TradeHistoryTable';
import { UsdcSwapModal } from 'components/usdc-swap-modal/UsdcSwapModal';
import { NEW_USDC_ADDRESS, OLD_USDC_ADDRESS } from 'components/usdc-swap-widget/constants';
import { useDialog } from 'hooks/useDialog';
import { getOpenOrders, getPositionRisk, getTradingFee } from 'network/network';
import { ChartHolder } from 'pages/trader-page/components/chart-holder/ChartHolder';
import { PerpetualStats } from 'pages/trader-page/components/perpetual-stats/PerpetualStats';
import { orderBlockPositionAtom } from 'store/app.store';
import {
  openOrdersAtom,
  perpetualStatisticsAtom,
  poolFeeAtom,
  addr0FeeAtom,
  positionsAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { OrderBlockPositionE, TableTypeE } from 'types/enums';
import { formatToCurrency } from 'utils/formatToCurrency';

import { PerpetualInfoFetcher } from './components/PerpetualInfoFetcher';
import { PoolSubscription } from './components/PoolSubscription';
import { CandlesWebSocketListener } from './components/candles-webSocket-listener/CandlesWebSocketListener';
import { TableDataFetcher } from './components/table-data-refetcher/TableDataFetcher';

import styles from './TraderPage.module.scss';

const MIN_REQUIRED_USDC = 20;

export const TraderPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeAllIndex, setActiveAllIndex] = useState(0);
  const [activePositionIndex, setActivePositionIndex] = useState(0);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(0);

  const fetchPositionsRef = useRef(false);
  const fetchOrdersRef = useRef(false);
  const fetchFeeRef = useRef(false);
  const fetchAddr0FeeRef = useRef(false);
  const isPageUrlAppliedRef = useRef(false);

  const { dialogOpen, openDialog, closeDialog } = useDialog();

  const [orderBlockPosition] = useAtom(orderBlockPositionAtom);
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [positions, setPositions] = useAtom(positionsAtom);
  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const setPoolFee = useSetAtom(poolFeeAtom);
  const setAddr0Fee = useSetAtom(addr0FeeAtom);

  const chainId = useChainId();
  const { address } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: legacyTokenData } = useBalance({
    address,
    token: OLD_USDC_ADDRESS,
    chainId: 1101,
    enabled: !!address && chainId === 1101,
  });

  const { data: newTokenData } = useBalance({
    address,
    token: NEW_USDC_ADDRESS,
    chainId: 1101,
    enabled: !!address && chainId === 1101,
  });

  useEffect(() => {
    if (!address || chainId !== 1101 || !legacyTokenData || !newTokenData) {
      return;
    }

    if (+newTokenData.formatted >= MIN_REQUIRED_USDC) {
      return;
    }

    if (+legacyTokenData.formatted >= MIN_REQUIRED_USDC) {
      openDialog();
    }
  }, [legacyTokenData, newTokenData, chainId, address, openDialog]);

  const fetchPositions = useCallback(
    async (_chainId: number, _address: Address) => {
      if (!traderAPI || traderAPI.chainId !== _chainId || !isSDKConnected || fetchPositionsRef.current) {
        return;
      }
      fetchPositionsRef.current = true;
      try {
        const { data } = await getPositionRisk(_chainId, traderAPI, _address);
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
    async (_chainId: number, _address: Address) => {
      if (!traderAPI || traderAPI.chainId !== _chainId || !isSDKConnected || fetchOrdersRef.current) {
        return;
      }
      fetchOrdersRef.current = true;
      try {
        const { data } = await getOpenOrders(_chainId, traderAPI, _address);
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

  const fetchAddr0Fee = useCallback(
    async (_chainId: number, _poolSymbol: string) => {
      if (fetchAddr0FeeRef.current) {
        return;
      }
      fetchAddr0FeeRef.current = true;
      try {
        const { data } = await getTradingFee(_chainId, _poolSymbol, '0x0000000000000000000000000000000000000000');
        setAddr0Fee(data);
      } catch (err) {
        console.error(err);
      } finally {
        fetchAddr0FeeRef.current = false;
      }
    },
    [setAddr0Fee]
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
    fetchFee(chainId, selectedPool.poolSymbol, address).then();
    fetchAddr0Fee(chainId, selectedPool.poolSymbol).then();
  }, [chainId, selectedPool?.poolSymbol, address, fetchFee, fetchAddr0Fee]);

  useEffect(() => {
    if (!chainId || !address) {
      return;
    }
    fetchPositions(chainId, address).then();
    fetchOrders(chainId, address).then();
  }, [chainId, address, fetchPositions, fetchOrders]);

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

  const handleActiveAllIndex = (index: number) => {
    setActiveAllIndex(index);

    const firstTableItems = positionItems.length;
    if (index < firstTableItems) {
      setActivePositionIndex(index);
    } else {
      setActiveHistoryIndex(index - firstTableItems);
    }
  };

  const handlePositionsIndex = (index: number) => {
    setActiveAllIndex(index);
    setActivePositionIndex(index);
  };

  const handleHistoryIndex = (index: number) => {
    setActiveAllIndex(index + positionItems.length);
    setActiveHistoryIndex(index);
  };

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
        <Container
          className={classnames(styles.headerContainer, {
            [styles.swapSides]: !isSmallScreen && orderBlockPosition === OrderBlockPositionE.Left,
          })}
        >
          <Box className={styles.leftBlock}>
            <PerpetualStats />
          </Box>
          <Box className={styles.rightBlock}>
            <MarketSelect />
          </Box>
        </Container>
        {!isSmallScreen && (
          <Container
            className={classnames(styles.sidesContainer, {
              [styles.swapSides]: orderBlockPosition === OrderBlockPositionE.Left,
            })}
          >
            <Box className={styles.leftBlock}>
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
        {isSmallScreen && (
          <Container className={styles.columnContainer}>
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
      </Box>

      <UsdcSwapModal isOpen={dialogOpen} onClose={closeDialog} />
      <TableDataFetcher />
      <PerpetualInfoFetcher />
      <PoolSubscription />
      <CandlesWebSocketListener />
    </>
  );
};

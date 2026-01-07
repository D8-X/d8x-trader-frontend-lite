import { TraderInterface } from '@d8x/perpetuals-sdk';
import classnames from 'classnames';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount, useReadContracts } from 'wagmi';
import { type Address, erc20Abi, formatUnits } from 'viem';

import { useMediaQuery, useTheme } from '@mui/material';

import { Container } from 'components/container/Container';
import { FundingTable } from 'components/funding-table/FundingTable';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { OpenOrdersTable } from 'components/open-orders-table/OpenOrdersTable';
import { OrderBlock } from 'components/order-block/OrderBlock';
import { PositionsTable } from 'components/positions-table/PositionsTable';
import { TableSelectorMobile } from 'components/table-selector-mobile/TableSelectorMobile';
import { type SelectorItemI, TableSelector } from 'components/table-selector/TableSelector';
import { TradeHistoryBlock } from 'components/trade-history-block/TradeHistoryBlock';
import { TradeHistoryTable } from 'components/trade-history-table/TradeHistoryTable';
import { UsdcSwapModal } from 'components/usdc-swap-modal/UsdcSwapModal';
import { NEW_USDC_ADDRESS, OLD_USDC_ADDRESS } from 'components/usdc-swap-widget/constants';
import { calculateProbability } from 'helpers/calculateProbability';
import { useDialog } from 'hooks/useDialog';
import { getOpenOrders, getPositionRisk } from 'network/network';
import { ChartHolder } from 'pages/trader-page/components/chart-holder/ChartHolder';
import { PerpetualStats } from 'pages/trader-page/components/perpetual-stats/PerpetualStats';
import { orderBlockPositionAtom } from 'store/app.store';
import { orderBlockAtom } from 'store/order-block.store';
import {
  openOrdersAtom,
  perpetualStaticInfoAtom,
  perpetualStatisticsAtom,
  positionsAtom,
  traderAPIAtom,
  executeScrollToTablesAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
} from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { OrderBlockE, OrderBlockPositionE, TableTypeE } from 'types/enums';
import { formatToCurrency } from 'utils/formatToCurrency';
import { isEnabledChain } from 'utils/isEnabledChain';

import { CandlesWebSocketListener } from './components/candles-webSocket-listener/CandlesWebSocketListener';
import { MobileMarketSelect } from './components/mobile-market-select/MobileMarketSelect';
import { PerpetualInfoFetcher } from './components/PerpetualInfoFetcher';
import { PriceSubmissionInfoFetcher } from './components/PriceSubmissionInfoFetcher';
import { PoolSubscription } from './components/PoolSubscription';
import { TableDataFetcher } from './components/table-data-refetcher/TableDataFetcher';

import styles from './TraderPage.module.scss';

const MIN_REQUIRED_USDC = 20;

export const TraderPage = () => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isUpToLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const isUpToMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { address, chainId, isConnected } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  const { dialogOpen, openDialog, closeDialog } = useDialog();

  const orderBlock = useAtomValue(orderBlockAtom);
  const orderBlockPosition = useAtomValue(orderBlockPositionAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const perpetualStatistics = useAtomValue(perpetualStatisticsAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const isSDKConnected = useAtomValue(sdkConnectedAtom);
  const [executeScrollToTables, setExecuteScrollToTables] = useAtom(executeScrollToTablesAtom);
  const [positions, setPositions] = useAtom(positionsAtom);
  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);

  const [activeAllIndex, setActiveAllIndex] = useState(0);
  const [activePositionIndex, setActivePositionIndex] = useState(0);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(0);

  const fetchPositionsRef = useRef(false);
  const fetchOrdersRef = useRef(false);
  const isPageUrlAppliedRef = useRef(false);
  const blockRef = useRef<HTMLDivElement>(null);

  const { data: legacyTokenData } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: OLD_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: OLD_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: { enabled: !!address && chainId === 1101 && isConnected },
  });

  const { data: newTokenData } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: NEW_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: NEW_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: { enabled: !!address && chainId === 1101 && isConnected },
  });

  useEffect(() => {
    if (!address || chainId !== 1101 || !legacyTokenData || !newTokenData) {
      return;
    }

    if (+formatUnits(newTokenData[0], newTokenData[1]) >= MIN_REQUIRED_USDC) {
      return;
    }

    if (+formatUnits(legacyTokenData[0], legacyTokenData[1]) >= MIN_REQUIRED_USDC) {
      openDialog();
    }
  }, [legacyTokenData, newTokenData, chainId, address, openDialog]);

  const fetchPositions = useCallback(
    async (_chainId: number, _address: Address) => {
      if (fetchPositionsRef.current || !isSDKConnected) {
        return;
      }

      fetchPositionsRef.current = true;
      try {
        const { data } = await getPositionRisk(_chainId, traderAPI, _address);
        if (data && data.length > 0) {
          data.map(setPositions);
        }
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
      if (fetchOrdersRef.current || !isSDKConnected) {
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

  useEffect(() => {
    if (!selectedPool || !selectedPerpetual || location.hash || isPageUrlAppliedRef.current) {
      return;
    }

    isPageUrlAppliedRef.current = true;
    const hash = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`;
    navigate(`${location.pathname}${location.search}#${hash}__chainId=${chainId}`);
  }, [selectedPool, selectedPerpetual, location.hash, location.pathname, location.search, navigate, chainId]);

  useEffect(() => {
    if (!address || !isEnabledChain(chainId)) {
      return;
    }
    fetchPositions(chainId, address).then();
    fetchOrders(chainId, address).then();

    return () => {
      fetchPositionsRef.current = false;
      fetchOrdersRef.current = false;
    };
  }, [chainId, address, fetchPositions, fetchOrders]);

  useEffect(() => {
    if (!executeScrollToTables) {
      return;
    }

    setActiveAllIndex(2);
    setActiveHistoryIndex(0);
    setExecuteScrollToTables(false);
    blockRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [executeScrollToTables, setExecuteScrollToTables]);

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

  const tradeHistoryItems: SelectorItemI[] = useMemo(
    () => [
      {
        label: `${t('pages.trade.history-table.table-title')}`,
        item: <TradeHistoryTable />,
        tableType: TableTypeE.TRADE_HISTORY,
      },
    ],
    [t]
  );

  const fundingItems: SelectorItemI[] = useMemo(
    () => [
      {
        label: `${t('pages.trade.funding-table.table-title')}`,
        item: <FundingTable />,
        tableType: TableTypeE.FUNDING,
      },
    ],
    [t]
  );

  const historyItems: SelectorItemI[] = useMemo(
    () => [...tradeHistoryItems, ...fundingItems],
    [tradeHistoryItems, fundingItems]
  );

  const selectorForAllItems: SelectorItemI[] = useMemo(
    () => [...positionItems, ...historyItems],
    [positionItems, historyItems]
  );

  const selectorForDesktopItems: SelectorItemI[] = useMemo(
    () => [...positionItems, ...fundingItems],
    [positionItems, fundingItems]
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

  let isPredictionMarket = false;
  try {
    isPredictionMarket = !!perpetualStaticInfo && TraderInterface.isPredictionMarketStatic(perpetualStaticInfo);
  } catch {
    // skip
  }

  return (
    <>
      <Helmet
        title={`${
          perpetualStatistics
            ? formatToCurrency(
                isPredictionMarket
                  ? calculateProbability(perpetualStatistics.midPrice, orderBlock === OrderBlockE.Short)
                  : perpetualStatistics.midPrice,
                `${perpetualStatistics.baseCurrency}-${perpetualStatistics.quoteCurrency}`,
                true
              )
            : ''
        } | D8X App`}
      />
      <div className={styles.root}>
        <MaintenanceWrapper>
          {isUpToLargeScreen && (
            <Container
              className={classnames(styles.headerContainer, {
                [styles.swapSides]: !isUpToLargeScreen && orderBlockPosition === OrderBlockPositionE.Left,
              })}
            >
              <div className={styles.leftBlock}>
                <PerpetualStats />
              </div>
              <div className={styles.rightBlock}>{isUpToMobileScreen && <MobileMarketSelect />}</div>
            </Container>
          )}
          {!isUpToLargeScreen && (
            <Container
              className={classnames(styles.sidesContainer, {
                [styles.swapSides]: orderBlockPosition === OrderBlockPositionE.Left,
              })}
            >
              <div className={styles.leftBlock}>
                <div className={styles.marketAndStats}>
                  <PerpetualStats />
                </div>
                <ChartHolder />
                <TableSelector
                  selectorItems={selectorForDesktopItems}
                  activeIndex={activeAllIndex}
                  setActiveIndex={handleActiveAllIndex}
                />
              </div>
              <div className={styles.rightBlock}>
                <OrderBlock />
                <TradeHistoryBlock />
              </div>
            </Container>
          )}
          {isUpToLargeScreen && (
            <Container className={styles.columnContainer}>
              <ChartHolder />
              <OrderBlock />
              {isUpToMobileScreen ? (
                <div ref={blockRef}>
                  <TableSelectorMobile
                    selectorItems={selectorForAllItems}
                    activeIndex={activeAllIndex}
                    setActiveIndex={handleActiveAllIndex}
                  />
                </div>
              ) : (
                <>
                  <TableSelector
                    selectorItems={positionItems}
                    activeIndex={activePositionIndex}
                    setActiveIndex={handlePositionsIndex}
                  />
                  <div ref={blockRef}>
                    <TableSelector
                      selectorItems={historyItems}
                      activeIndex={activeHistoryIndex}
                      setActiveIndex={handleHistoryIndex}
                    />
                  </div>
                </>
              )}
            </Container>
          )}
        </MaintenanceWrapper>
      </div>

      <UsdcSwapModal isOpen={dialogOpen} onClose={closeDialog} />
      <TableDataFetcher />
      <PerpetualInfoFetcher />
      <PriceSubmissionInfoFetcher />
      <PoolSubscription />
      <CandlesWebSocketListener />
    </>
  );
};

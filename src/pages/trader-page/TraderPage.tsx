import { memo, useCallback, useMemo, useState } from 'react';

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
import { TradingViewChart } from 'components/trading-view-chart/TradingViewChart';
import { PerpetualStats } from 'pages/trader-page/components/perpetual-stats/PerpetualStats';

import { TableTypeE } from 'types/enums';

import styles from './TraderPage.module.scss';

export const TraderPage = memo(() => {
  const theme = useTheme();
  const isBigScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeAllIndex, setActiveAllIndex] = useState(0);
  const [activePositionIndex, setActivePositionIndex] = useState(0);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(0);

  const positionItems: SelectorItemI[] = useMemo(
    () => [
      {
        label: 'Positions',
        item: <PositionsTable />,
        tableType: TableTypeE.POSITIONS,
      },
      {
        label: 'Open Orders',
        item: <OpenOrdersTable />,
        tableType: TableTypeE.OPEN_ORDERS,
      },
    ],
    []
  );

  const historyItems: SelectorItemI[] = useMemo(
    () => [
      {
        label: 'Trade History',
        item: <TradeHistoryTable />,
        tableType: TableTypeE.TRADE_HISTORY,
      },
      {
        label: 'Funding',
        item: <FundingTable />,
        tableType: TableTypeE.FUNDING,
      },
    ],
    []
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
    <Box className={styles.root}>
      <Header>
        <CollateralsSelect />
        <PerpetualsSelect />
      </Header>
      {isBigScreen && (
        <Container className={styles.sidesContainer}>
          <Box className={styles.leftBlock}>
            <PerpetualStats />
            <TradingViewChart />
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
          <TradingViewChart />
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
  );
});

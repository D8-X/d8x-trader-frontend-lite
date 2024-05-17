import classnames from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount, useChainId } from 'wagmi';

import { Table as MuiTable, TableBody, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material';

import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { FilterModal } from 'components/table/filter-modal/FilterModal';
import { useFilter } from 'components/table/filter-modal/useFilter';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { getComparator, stableSort } from 'helpers/tableSort';
import { getPositionRisk } from 'network/network';
import {
  clearPositionsAtom,
  openOrdersAtom,
  poolsAtom,
  positionsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
  traderAPIBusyAtom,
} from 'store/pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { AlignE, FieldTypeE, OpenOrderTypeE, OrderSideE, OrderValueTypeE, SortOrderE, TableTypeE } from 'types/enums';
import type { MarginAccountWithAdditionalDataI, TableHeaderI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

import { hasTpSlOrdersAtom } from '../order-block/elements/action-block/store';
import { CloseModal } from './elements/modals/close-modal/CloseModal';
import { ModifyModal } from './elements/modals/modify-modal/ModifyModal';
import { ModifyTpSlModal } from './elements/modals/modify-tp-sl-modal/ModifyTpSlModal';
import { ShareModal } from './elements/modals/share-modal/ShareModal';
import { PositionBlock } from './elements/position-block/PositionBlock';
import { PositionRow } from './elements/position-row/PositionRow';

import styles from './PositionsTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;

export const PositionsTable = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { width, ref } = useResizeDetector();

  const selectedPool = useAtomValue(selectedPoolAtom);
  const pools = useAtomValue(poolsAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const openOrders = useAtomValue(openOrdersAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const isSDKConnected = useAtomValue(sdkConnectedAtom);
  const [positions, setPositions] = useAtom(positionsAtom);
  const setAPIBusy = useSetAtom(traderAPIBusyAtom);
  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);
  const setHasTpSlOrders = useSetAtom(hasTpSlOrdersAtom);
  const clearPositions = useSetAtom(clearPositionsAtom);

  const [isTpSlChangeModalOpen, setTpSlChangeModalOpen] = useState(false);
  const [isModifyModalOpen, setModifyModalOpen] = useState(false);
  const [isCloseModalOpen, setCloseModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<MarginAccountWithAdditionalDataI | null>();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Asc);
  const [orderBy, setOrderBy] = useState<keyof MarginAccountWithAdditionalDataI>('symbol');

  const isAPIBusyRef = useRef(false);
  const isSelectedPositionSetRef = useRef(false);

  const handleTpSlModify = useCallback((position: MarginAccountWithAdditionalDataI) => {
    setTpSlChangeModalOpen(true);
    setSelectedPosition(position);
    isSelectedPositionSetRef.current = true;
  }, []);

  const handlePositionModify = useCallback((position: MarginAccountWithAdditionalDataI) => {
    setModifyModalOpen(true);
    setSelectedPosition(position);
    isSelectedPositionSetRef.current = true;
  }, []);

  const handlePositionClose = useCallback((position: MarginAccountWithAdditionalDataI) => {
    setCloseModalOpen(true);
    setSelectedPosition(position);
    isSelectedPositionSetRef.current = true;
  }, []);

  const handlePositionShare = useCallback((position: MarginAccountWithAdditionalDataI) => {
    setShareModalOpen(true);
    setSelectedPosition(position);
    isSelectedPositionSetRef.current = true;
  }, []);

  const closeTpSlModal = useCallback(() => {
    setTpSlChangeModalOpen(false);
    setSelectedPosition(null);
    isSelectedPositionSetRef.current = true;
  }, []);

  const closeModifyModal = useCallback(() => {
    setModifyModalOpen(false);
    setSelectedPosition(null);
    isSelectedPositionSetRef.current = true;
  }, []);

  const closeCloseModal = useCallback(() => {
    setCloseModalOpen(false);
    setSelectedPosition(null);
    isSelectedPositionSetRef.current = true;
  }, []);

  const poolByPosition = useMemo(() => {
    if (!selectedPosition?.symbol || pools.length === 0) {
      return null;
    }

    const parsedSymbol = parseSymbol(selectedPosition.symbol);
    const foundPool = pools.find(({ poolSymbol }) => poolSymbol === parsedSymbol?.poolSymbol);
    return foundPool || null;
  }, [pools, selectedPosition?.symbol]);

  const refreshPositions = useCallback(async () => {
    if (address && traderAPI && isConnected && isEnabledChain(chainId) && isSDKConnected) {
      if (isAPIBusyRef.current || chainId !== traderAPI.chainId) {
        return;
      }

      setAPIBusy(true);
      isAPIBusyRef.current = true;

      try {
        const { data } = await getPositionRisk(chainId, traderAPI, address, Date.now());
        clearPositions();
        if (data && data.length > 0) {
          data.map(setPositions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAPIBusy(false);
        isAPIBusyRef.current = false;
      }
    }
  }, [chainId, address, isConnected, isSDKConnected, setAPIBusy, setPositions, clearPositions, traderAPI]);

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.POSITIONS]: refreshPositions }));
  }, [refreshPositions, setTableRefreshHandlers]);

  const positionsHeaders: TableHeaderI<MarginAccountWithAdditionalDataI>[] = useMemo(
    () => [
      {
        field: 'symbol',
        label: t('pages.trade.positions-table.table-header.symbol'),
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'positionNotionalBaseCCY',
        label: t('pages.trade.positions-table.table-header.size'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'side',
        label: t('pages.trade.positions-table.table-header.side'),
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'entryPrice',
        label: t('pages.trade.positions-table.table-header.entry-price'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'liqPrice',
        label: t('pages.trade.positions-table.table-header.liq-price'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'collateralCC',
        label: t('pages.trade.positions-table.table-header.margin'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'unrealizedPnlQuoteCCY',
        label: t('pages.trade.positions-table.table-header.pnl'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        numeric: true,
        label: t('pages.trade.positions-table.table-header.tp-sl'),
        tooltip: t('pages.trade.positions-table.table-header.tp-sl-tooltip'),
        align: AlignE.Right,
      },
      {
        label: '',
        align: AlignE.Right,
      },
    ],
    [t]
  );

  function areFloatsEqual(a: number, b: number, epsilon = 0.0001): boolean {
    return Math.abs(a - b) / Math.abs(a) <= epsilon;
  }

  const positionsWithLiqPrice = useMemo(
    () =>
      positions.map((position): MarginAccountWithAdditionalDataI => {
        const filteredOpenOrders = openOrders.filter(
          (openOrder) => openOrder.symbol === position.symbol && openOrder.side !== position.side
        );

        const takeProfitOrders = filteredOpenOrders.filter((openOrder) => openOrder.type === OpenOrderTypeE.Limit);
        let takeProfitValueType = OrderValueTypeE.None;
        let takeProfitFullValue;
        if (takeProfitOrders.length > 0) {
          if (takeProfitOrders.length > 1) {
            const totalQuantity = takeProfitOrders.reduce((sum, tpOrder) => sum + tpOrder.quantity, 0);
            const totalQuantityReduceOnly = takeProfitOrders.reduce((sum, tpOrder) => {
              return tpOrder.reduceOnly ? sum + tpOrder.quantity : sum;
            }, 0);
            if (areFloatsEqual(totalQuantity, position.positionNotionalBaseCCY)) {
              // if the sum of all TP order sizes is equal to position.positionNotionalBaseCCY -> multiple
              takeProfitValueType = OrderValueTypeE.Multiple;
            } else if (totalQuantity < position.positionNotionalBaseCCY) {
              // if the sum of all TP order sizes is less than position.positionNotionalBaseCCY -> partial
              takeProfitValueType = OrderValueTypeE.Partial;
            } else if (areFloatsEqual(totalQuantityReduceOnly, totalQuantity)) {
              // if the sum of all TP order sizes is greater than position.positionNotionalBaseCCY,
              // but they are all reduceOnly -> multiple
              takeProfitValueType = OrderValueTypeE.Multiple;
            } else {
              // if the sum of all TP order sizes is greater than position.positionNotionalBaseCCY
              // and at least one order is not reduce only -> exceeded
              takeProfitValueType = OrderValueTypeE.Exceeded;
            }
          } else if (areFloatsEqual(takeProfitOrders[0].quantity, position.positionNotionalBaseCCY)) {
            // if 1 TP order exists for an order size that is = position.size, show limitPrice
            takeProfitValueType = OrderValueTypeE.Full;
            takeProfitFullValue = takeProfitOrders[0].limitPrice;
          } else if (takeProfitOrders[0].quantity < position.positionNotionalBaseCCY) {
            // if 1 TP order exists for an order size that is < position.size, the TP/SL column displays "partial"
            takeProfitValueType = OrderValueTypeE.Partial;
          } else if (takeProfitOrders[0].reduceOnly) {
            // if 1 TP order exists for an order size that is > position.size, but the order is reduceOnly, show limitPrice
            takeProfitValueType = OrderValueTypeE.Full;
            takeProfitFullValue = takeProfitOrders[0].limitPrice;
          } else {
            // if 1 TP order exists for an order size that is > position.size and the order is not reduceOnly,
            // show stopPrice of that order for SL
            takeProfitValueType = OrderValueTypeE.Exceeded;
          }
        }

        const stopLossOrders = filteredOpenOrders.filter(
          (openOrder) =>
            openOrder.type === OpenOrderTypeE.StopLimit &&
            ((openOrder.side === OrderSideE.Sell &&
              openOrder.limitPrice !== undefined &&
              openOrder.limitPrice === 0 &&
              openOrder.stopPrice &&
              openOrder.stopPrice <= position.entryPrice) ||
              (openOrder.side === OrderSideE.Buy &&
                openOrder.limitPrice !== undefined &&
                openOrder.limitPrice === Number.POSITIVE_INFINITY &&
                openOrder.stopPrice &&
                openOrder.stopPrice >= position.entryPrice))
        );
        let stopLossValueType = OrderValueTypeE.None;
        let stopLossFullValue;
        if (stopLossOrders.length > 0) {
          if (stopLossOrders.length > 1) {
            const totalQuantity = stopLossOrders.reduce((sum, slOrder) => sum + slOrder.quantity, 0);
            const totalQuantityReduceOnly = stopLossOrders.reduce((sum, slOrder) => {
              return slOrder.reduceOnly ? sum + slOrder.quantity : sum;
            }, 0);
            if (areFloatsEqual(totalQuantity, position.positionNotionalBaseCCY)) {
              // if the sum of all SL order sizes is equal to position.positionNotionalBaseCCY -> multiple
              stopLossValueType = OrderValueTypeE.Multiple;
            } else if (totalQuantity < position.positionNotionalBaseCCY) {
              // if the sum of all SL order sizes is less than position.positionNotionalBaseCCY -> partial
              stopLossValueType = OrderValueTypeE.Partial;
            } else if (areFloatsEqual(totalQuantityReduceOnly, totalQuantity)) {
              // if the sum of all SL order sizes is greater than position.positionNotionalBaseCCY,
              // but they are all reduceOnly -> multiple
              stopLossValueType = OrderValueTypeE.Multiple;
            } else {
              // if the sum of all SL order sizes is greater than position.positionNotionalBaseCCY
              // and at least one order is not reduce only -> exceeded
              stopLossValueType = OrderValueTypeE.Exceeded;
            }
          } else if (areFloatsEqual(stopLossOrders[0].quantity, position.positionNotionalBaseCCY)) {
            // if 1 SL order exists for an order size that is = position.size, show stopPrice of that order for SL
            stopLossValueType = OrderValueTypeE.Full;
            stopLossFullValue = stopLossOrders[0].stopPrice;
          } else if (stopLossOrders[0].quantity < position.positionNotionalBaseCCY) {
            // if 1 SL order exists for an order size that is < position.size, the TP/SL column displays "partial" for the SL price
            stopLossValueType = OrderValueTypeE.Partial;
          } else if (stopLossOrders[0].reduceOnly) {
            // if 1 SL order exists for an order size that is > position.size, but the order is reduceOnly, show stopPrice
            stopLossValueType = OrderValueTypeE.Full;
            stopLossFullValue = stopLossOrders[0].stopPrice;
          } else {
            // if 1 TP order exists for an order size that is > position.size, show stopPrice of that order for SL
            stopLossValueType = OrderValueTypeE.Exceeded;
          }
        }

        return {
          ...position,
          liqPrice: position.liquidationPrice[0],
          takeProfit: {
            orders: takeProfitOrders,
            valueType: takeProfitValueType,
            fullValue: takeProfitFullValue,
          },
          stopLoss: {
            orders: stopLossOrders,
            valueType: stopLossValueType,
            fullValue: stopLossFullValue,
          },
        };
      }),
    [positions, openOrders]
  );

  useEffect(() => {
    let hasTpSlOrders = false;
    if (selectedPool && selectedPerpetual && positionsWithLiqPrice.length > 0) {
      const symbol = createSymbol({
        baseCurrency: selectedPerpetual.baseCurrency,
        quoteCurrency: selectedPerpetual.quoteCurrency,
        poolSymbol: selectedPool.poolSymbol,
      });

      const foundPosition = positionsWithLiqPrice.find((position) => position.symbol === symbol);
      if (foundPosition) {
        hasTpSlOrders = foundPosition.takeProfit.orders.length > 0 || foundPosition.stopLoss.orders.length > 0;
      }
    }
    setHasTpSlOrders(hasTpSlOrders);
  }, [selectedPool, selectedPerpetual, positionsWithLiqPrice, setHasTpSlOrders]);

  const { filter, setFilter, filteredRows } = useFilter(positionsWithLiqPrice, positionsHeaders);

  const visibleRows = useMemo(
    () =>
      stableSort(filteredRows, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [filteredRows, page, rowsPerPage, order, orderBy]
  );

  useEffect(() => {
    if (!isSelectedPositionSetRef.current && selectedPosition != null) {
      const foundRow = filteredRows.find((row) => row.symbol === selectedPosition.symbol);
      setSelectedPosition(foundRow);
      isSelectedPositionSetRef.current = true;
    } else {
      isSelectedPositionSetRef.current = false;
    }
  }, [filteredRows, selectedPosition]);

  useEffect(() => {
    if (filteredRows.length > 0 && filteredRows.length <= page * rowsPerPage) {
      setPage((prevPage) => Math.max(0, prevPage - 1));
    }
  }, [filteredRows.length, page, rowsPerPage]);

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={classnames(styles.tableHolder, styles.withBackground)}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                <SortableHeaders<MarginAccountWithAdditionalDataI>
                  headers={positionsHeaders}
                  order={order}
                  orderBy={orderBy}
                  setOrder={setOrder}
                  setOrderBy={setOrderBy}
                />
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {address &&
                visibleRows.map((position) => (
                  <PositionRow
                    key={position.symbol}
                    position={position}
                    handlePositionClose={handlePositionClose}
                    handlePositionModify={handlePositionModify}
                    handlePositionShare={handlePositionShare}
                    handleTpSlModify={handleTpSlModify}
                  />
                ))}
              {(!address || positions.length === 0) && (
                <EmptyRow
                  colSpan={positionsHeaders.length}
                  text={
                    !address
                      ? t('pages.trade.positions-table.table-content.connect')
                      : t('pages.trade.positions-table.table-content.no-open')
                  }
                />
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>
      )}
      {(!width || width < MIN_WIDTH_FOR_TABLE) && (
        <div className={styles.blocksHolder}>
          {address &&
            visibleRows.map((position) => (
              <PositionBlock
                key={position.symbol}
                headers={positionsHeaders}
                position={position}
                handlePositionClose={handlePositionClose}
                handlePositionModify={handlePositionModify}
                handlePositionShare={handlePositionShare}
                handleTpSlModify={handleTpSlModify}
              />
            ))}
          {(!address || positions.length === 0) && (
            <div className={styles.noData}>
              {!address
                ? t('pages.trade.positions-table.table-content.connect')
                : t('pages.trade.positions-table.table-content.no-open')}
            </div>
          )}
        </div>
      )}
      {address && positions.length > 5 && (
        <div
          className={classnames(styles.paginationHolder, {
            [styles.withBackground]: width && width >= MIN_WIDTH_FOR_TABLE,
          })}
        >
          <TablePagination
            align="center"
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={positions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(+event.target.value);
              setPage(0);
            }}
            labelRowsPerPage={t('common.pagination.per-page')}
          />
        </div>
      )}
      <div
        className={classnames(styles.footer, { [styles.withBackground]: width && width >= MIN_WIDTH_FOR_TABLE })}
      ></div>

      <FilterModal headers={positionsHeaders} filter={filter} setFilter={setFilter} />
      <ShareModal
        isOpen={isShareModalOpen}
        selectedPosition={selectedPosition}
        closeModal={() => {
          setShareModalOpen(false);
          setSelectedPosition(null);
          isSelectedPositionSetRef.current = true;
        }}
      />
      <ModifyTpSlModal
        isOpen={isTpSlChangeModalOpen}
        selectedPosition={selectedPosition}
        poolByPosition={poolByPosition}
        closeModal={closeTpSlModal}
      />
      <ModifyModal
        isOpen={isModifyModalOpen}
        selectedPosition={selectedPosition}
        poolByPosition={poolByPosition}
        closeModal={closeModifyModal}
      />
      <CloseModal
        isOpen={isCloseModalOpen}
        selectedPosition={selectedPosition}
        poolByPosition={poolByPosition}
        closeModal={closeCloseModal}
      />
    </div>
  );
};

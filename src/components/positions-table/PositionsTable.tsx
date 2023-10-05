import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount, useChainId } from 'wagmi';

import { Box, Table as MuiTable, TableBody, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material';

import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { FilterI, FilterPopup } from 'components/table/filter-popup/FilterPopup';
import { filterRows } from 'components/table/filter-popup/filter';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { createSymbol } from 'helpers/createSymbol';
import { getComparator, stableSort } from 'helpers/tableSort';
import { getPositionRisk } from 'network/network';
import {
  positionsAtom,
  removePositionAtom,
  selectedPoolAtom,
  traderAPIAtom,
  traderAPIBusyAtom,
} from 'store/pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { AlignE, FieldTypeE, SortOrderE, TableTypeE } from 'types/enums';
import type { MarginAccountI, TableHeaderI } from 'types/types';
import { MarginAccountWithLiqPriceI } from 'types/types';

import { CloseModal } from './elements/modals/close-modal/CloseModal';
import { ModifyModal } from './elements/modals/modify-modal/ModifyModal';
import { PositionBlock } from './elements/position-block/PositionBlock';
import { PositionRow } from './elements/position-row/PositionRow';

import styles from './PositionsTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;

export const PositionsTable = () => {
  const { t } = useTranslation();

  const [selectedPool] = useAtom(selectedPoolAtom);
  const [positions, setPositions] = useAtom(positionsAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const removePosition = useSetAtom(removePositionAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [isAPIBusy, setAPIBusy] = useAtom(traderAPIBusyAtom);
  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);

  const isAPIBusyRef = useRef(isAPIBusy);

  const chainId = useChainId();
  const { address, isConnected, isDisconnected } = useAccount();
  const { width, ref } = useResizeDetector();

  const [isModifyModalOpen, setModifyModalOpen] = useState(false);
  const [isCloseModalOpen, setCloseModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<MarginAccountI | null>();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Asc);
  const [orderBy, setOrderBy] = useState<keyof MarginAccountWithLiqPriceI>('symbol');
  const [filter, setFilter] = useState<FilterI<MarginAccountWithLiqPriceI>>({});

  const handlePositionModify = useCallback((position: MarginAccountI) => {
    setModifyModalOpen(true);
    setSelectedPosition(position);
  }, []);

  const handlePositionClose = useCallback((position: MarginAccountI) => {
    setCloseModalOpen(true);
    setSelectedPosition(position);
  }, []);

  const closeModifyModal = useCallback(() => {
    setModifyModalOpen(false);
    setSelectedPosition(null);
  }, []);

  const closeCloseModal = useCallback(() => {
    setCloseModalOpen(false);
    setSelectedPosition(null);
  }, []);

  const clearPositions = useCallback(() => {
    if (selectedPool?.perpetuals) {
      selectedPool.perpetuals.forEach(({ baseCurrency, quoteCurrency }) => {
        const symbol = createSymbol({
          baseCurrency,
          quoteCurrency,
          poolSymbol: selectedPool.poolSymbol,
        });
        removePosition(symbol);
      });
    }
  }, [selectedPool, removePosition]);

  useEffect(() => {
    if (isDisconnected || traderAPI?.chainId !== chainId) {
      clearPositions();
    }
  }, [isDisconnected, chainId, clearPositions, traderAPI]);

  const refreshPositions = useCallback(async () => {
    if (address && isConnected && chainId && isSDKConnected) {
      if (isAPIBusyRef.current || chainId !== traderAPI?.chainId) {
        return;
      }
      setAPIBusy(true);
      try {
        const { data } = await getPositionRisk(chainId, traderAPI, address, Date.now());
        clearPositions();
        data.map(setPositions);
      } catch (err) {
        console.error(err);
      } finally {
        setAPIBusy(false);
      }
    }
  }, [chainId, address, isConnected, isSDKConnected, setAPIBusy, setPositions, clearPositions, traderAPI]);

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.POSITIONS]: refreshPositions }));
  }, [refreshPositions, setTableRefreshHandlers]);

  const positionsHeaders: TableHeaderI<MarginAccountWithLiqPriceI>[] = useMemo(
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
    ],
    [t]
  );

  const positionsWithLiqPrice = useMemo(() => {
    return positions.map((position): MarginAccountWithLiqPriceI => {
      return {
        ...position,
        liqPrice: position.liquidationPrice[0],
      };
    });
  }, [positions]);

  const filteredRows = useMemo(() => filterRows(positionsWithLiqPrice, filter), [positionsWithLiqPrice, filter]);

  const visibleRows = useMemo(
    () =>
      stableSort(filteredRows, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [filteredRows, page, rowsPerPage, order, orderBy]
  );

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={styles.tableHolder}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                <SortableHeaders<MarginAccountWithLiqPriceI>
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
        <Box>
          {address &&
            visibleRows.map((position) => (
              <PositionBlock
                key={position.symbol}
                headers={positionsHeaders}
                position={position}
                handlePositionClose={handlePositionClose}
                handlePositionModify={handlePositionModify}
              />
            ))}
          {(!address || positions.length === 0) && (
            <Box className={styles.noData}>
              {!address
                ? t('pages.trade.positions-table.table-content.connect')
                : t('pages.trade.positions-table.table-content.no-open')}
            </Box>
          )}
        </Box>
      )}
      {address && positions.length > 5 && (
        <Box className={styles.paginationHolder}>
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
        </Box>
      )}

      <FilterPopup headers={positionsHeaders} filter={filter} setFilter={setFilter} />
      <ModifyModal isOpen={isModifyModalOpen} selectedPosition={selectedPosition} closeModal={closeModifyModal} />
      <CloseModal isOpen={isCloseModalOpen} selectedPosition={selectedPosition} closeModal={closeCloseModal} />
    </div>
  );
};

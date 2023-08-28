import { useAtom } from 'jotai';
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount, useChainId } from 'wagmi';

import {
  Box,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

import { EmptyTableRow } from 'components/empty-table-row/EmptyTableRow';
import { createSymbol } from 'helpers/createSymbol';
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
import { AlignE, TableTypeE } from 'types/enums';
import type { MarginAccountI, TableHeaderI } from 'types/types';

import { CloseModal } from './elements/modals/close-modal/CloseModal';
import { ModifyModal } from './elements/modals/modify-modal/ModifyModal';
import { PositionBlock } from './elements/position-block/PositionBlock';
import { PositionRow } from './elements/position-row/PositionRow';

import styles from './PositionsTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;

export const PositionsTable = memo(() => {
  const { t } = useTranslation();

  const [selectedPool] = useAtom(selectedPoolAtom);
  const [positions, setPositions] = useAtom(positionsAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [, removePosition] = useAtom(removePositionAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [isAPIBusy, setAPIBusy] = useAtom(traderAPIBusyAtom);
  const [, setTableRefreshHandlers] = useAtom(tableRefreshHandlersAtom);

  const traderAPIRef = useRef(traderAPI);
  const isAPIBusyRef = useRef(isAPIBusy);

  const chainId = useChainId();
  const { address, isConnected, isDisconnected } = useAccount();
  const { width, ref } = useResizeDetector();

  const [isModifyModalOpen, setModifyModalOpen] = useState(false);
  const [isCloseModalOpen, setCloseModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<MarginAccountI | null>();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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
    if (isDisconnected || traderAPIRef.current?.chainId !== chainId) {
      clearPositions();
    }
  }, [isDisconnected, chainId, clearPositions]);

  const refreshPositions = useCallback(async () => {
    if (selectedPool?.poolSymbol && address && isConnected && chainId && isSDKConnected) {
      if (isAPIBusyRef.current || chainId !== traderAPIRef.current?.chainId) {
        return;
      }
      setAPIBusy(true);
      await getPositionRisk(chainId, traderAPIRef.current, selectedPool.poolSymbol, address, Date.now())
        .then(({ data }) => {
          setAPIBusy(false);
          clearPositions();
          if (data && data.length > 0) {
            data.map((p) => setPositions(p));
          }
        })
        .catch((err) => {
          console.error(err);
          setAPIBusy(false);
        });
    }
  }, [
    chainId,
    address,
    isConnected,
    selectedPool?.poolSymbol,
    isSDKConnected,
    setAPIBusy,
    setPositions,
    clearPositions,
  ]);

  useEffect(() => {
    if (isSDKConnected) {
      traderAPIRef.current = traderAPI;
    }
  }, [traderAPI, isSDKConnected]);

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.POSITIONS]: refreshPositions }));
  }, [refreshPositions, setTableRefreshHandlers]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  }, []);

  const positionsHeaders: TableHeaderI[] = useMemo(
    () => [
      { label: t('pages.trade.positions-table.table-header.symbol'), align: AlignE.Left },
      { label: t('pages.trade.positions-table.table-header.size'), align: AlignE.Right },
      { label: t('pages.trade.positions-table.table-header.side'), align: AlignE.Left },
      { label: t('pages.trade.positions-table.table-header.entry-price'), align: AlignE.Right },
      { label: t('pages.trade.positions-table.table-header.liq-price'), align: AlignE.Right },
      {
        label: `${t('pages.trade.positions-table.table-header.margin')} (${selectedPool?.poolSymbol})`,
        align: AlignE.Right,
      },
      { label: t('pages.trade.positions-table.table-header.pnl'), align: AlignE.Right },
    ],
    [selectedPool, t]
  );

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={styles.tableHolder}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                {positionsHeaders.map((header) => (
                  <TableCell key={header.label.toString()} align={header.align}>
                    <Typography variant="bodySmall">{header.label}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {address &&
                positions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((position) => (
                    <PositionRow
                      key={position.symbol}
                      position={position}
                      handlePositionClose={handlePositionClose}
                      handlePositionModify={handlePositionModify}
                    />
                  ))}
              {(!address || positions.length === 0) && (
                <EmptyTableRow
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
            positions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((position) => (
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t('common.pagination.per-page')}
          />
        </Box>
      )}

      <ModifyModal isOpen={isModifyModalOpen} selectedPosition={selectedPosition} closeModal={closeModifyModal} />
      <CloseModal isOpen={isCloseModalOpen} selectedPosition={selectedPosition} closeModal={closeCloseModal} />
    </div>
  );
});

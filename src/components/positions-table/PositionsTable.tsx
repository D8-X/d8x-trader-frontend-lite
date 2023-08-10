import { HashZero } from '@ethersproject/constants';
import { useAtom } from 'jotai';
import type { ChangeEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useWaitForTransaction, useWalletClient } from 'wagmi';

import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  Link,
  Table as MuiTable,
  OutlinedInput,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { deposit } from 'blockchain-api/contract-interactions/deposit';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { withdraw } from 'blockchain-api/contract-interactions/withdraw';
import { Dialog } from 'components/dialog/Dialog';
import { EmptyTableRow } from 'components/empty-table-row/EmptyTableRow';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';

import { ModifyTypeE, ModifyTypeSelector } from './elements/modify-type-selector/ModifyTypeSelector';
import { PositionBlock } from './elements/position-block/PositionBlock';
import { PositionRow } from './elements/PositionRow';

import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { useDebounce } from 'helpers/useDebounce';
import { formatNumber } from 'utils/formatNumber';
import { formatToCurrency } from 'utils/formatToCurrency';

import {
  getAddCollateral,
  getAvailableMargin,
  getPositionRisk,
  getRemoveCollateral,
  orderDigest,
  positionRiskOnCollateralAction,
} from 'network/network';
import {
  poolTokenDecimalsAtom,
  positionsAtom,
  proxyAddrAtom,
  removePositionAtom,
  selectedPoolAtom,
  traderAPIAtom,
  traderAPIBusyAtom,
} from 'store/pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { AlignE, OrderTypeE, TableTypeE } from 'types/enums';
import type { AddressT, MarginAccountI, OrderI, TableHeaderI } from 'types/types';

import styles from './PositionsTable.module.scss';

import { Separator } from 'components/separator/Separator';

const MIN_WIDTH_FOR_TABLE = 900;

export const PositionsTable = memo(() => {
  const { t } = useTranslation();
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [positions, setPositions] = useAtom(positionsAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [, removePosition] = useAtom(removePositionAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [isAPIBusy, setAPIBusy] = useAtom(traderAPIBusyAtom);
  const [, setTableRefreshHandlers] = useAtom(tableRefreshHandlersAtom);
  const [poolTokenDecimals] = useAtom(poolTokenDecimalsAtom);

  const traderAPIRef = useRef(traderAPI);
  const isAPIBusyRef = useRef(isAPIBusy);

  const chainId = useChainId();
  const { address, isConnected, isDisconnected } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: chainId });
  const { width, ref } = useResizeDetector();

  const [modifyType, setModifyType] = useState(ModifyTypeE.Close);
  const [closePositionChecked, setClosePositionChecked] = useState(false);
  const [addCollateral, setAddCollateral] = useState(0);
  const [removeCollateral, setRemoveCollateral] = useState(0);
  const [isModifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<MarginAccountI | null>();
  const [newPositionRisk, setNewPositionRisk] = useState<MarginAccountI | null>();
  const [requestSent, setRequestSent] = useState(false);
  const [maxCollateral, setMaxCollateral] = useState<number>();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [txHash, setTxHash] = useState<AddressT | undefined>(undefined);

  const handlePositionModify = useCallback((position: MarginAccountI) => {
    setModifyModalOpen(true);
    setSelectedPosition(position);
    setClosePositionChecked(false);
    setAddCollateral(0);
    setRemoveCollateral(0);
    setModifyType(ModifyTypeE.Close);
  }, []);

  const closeModifyModal = useCallback(() => {
    setModifyModalOpen(false);
    setSelectedPosition(null);
  }, []);

  useWaitForTransaction({
    hash: txHash,
    onSuccess() {
      if (modifyType === ModifyTypeE.Add) {
        toast.success(<ToastContent title="Collateral Added" bodyLines={[]} />);
      } else if (modifyType === ModifyTypeE.Remove) {
        toast.success(<ToastContent title="Collateral Removed" bodyLines={[]} />);
      } else if (modifyType === ModifyTypeE.Close) {
        toast.success(<ToastContent title="Order Submitted" bodyLines={[]} />);
      }
    },
    onError() {
      toast.error(<ToastContent title="Error Processing Transaction" bodyLines={[]} />);
    },
    onSettled() {
      setTxHash(undefined);
    },
    enabled: !!address,
  });

  const handleModifyPositionConfirm = useCallback(async () => {
    if (!selectedPosition || !address || !selectedPool || !proxyAddr || !walletClient || !poolTokenDecimals) {
      return;
    }

    if (requestSent) {
      return;
    }

    if (modifyType === ModifyTypeE.Close) {
      setRequestSent(true);

      const closeOrder: OrderI = {
        symbol: selectedPosition.symbol,
        side: selectedPosition.side === 'BUY' ? 'SELL' : 'BUY',
        type: OrderTypeE.Market.toUpperCase(),
        quantity: selectedPosition.positionNotionalBaseCCY,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10),
        reduceOnly: true,
        leverage: selectedPosition.leverage,
      };

      orderDigest(chainId, [closeOrder], address)
        .then((data) => {
          if (data.data.digests.length > 0) {
            approveMarginToken(walletClient, selectedPool.marginTokenAddr, proxyAddr, 0, poolTokenDecimals).then(() => {
              const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
              postOrder(walletClient, signatures, data.data)
                .then((tx) => {
                  setTxHash(tx.hash);
                  console.log(`postOrder tx hash: ${tx.hash}`);
                  toast.success(
                    <ToastContent title={t('pages.trade.positions-table.toasts.submit-close.title')} bodyLines={[]} />
                  );
                })
                .catch((error) => {
                  console.error(error);
                  let msg = (error?.message ?? error) as string;
                  msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
                  toast.error(
                    <ToastContent
                      title={t('pages.trade.positions-table.toasts.error-processing.title')}
                      bodyLines={[{ label: t('pages.trade.positions-table.toasts.error-processing.body'), value: msg }]}
                    />
                  );
                })
                .finally(() => {
                  setRequestSent(false);
                  setModifyModalOpen(false);
                  setSelectedPosition(null);
                });
            });
          }
        })
        .catch((error) => {
          setRequestSent(false);
          console.error(error);
        });
    } else if (modifyType === ModifyTypeE.Add) {
      setRequestSent(true);
      getAddCollateral(chainId, traderAPIRef.current, selectedPosition.symbol, addCollateral)
        .then(({ data }) => {
          approveMarginToken(
            walletClient,
            selectedPool.marginTokenAddr,
            proxyAddr,
            addCollateral,
            poolTokenDecimals
          ).then(() => {
            deposit(walletClient, data)
              .then((tx) => {
                console.log(`deposit tx hash: ${tx.hash}`);
                setTxHash(tx.hash);
                toast.success(
                  <ToastContent
                    title={t('pages.trade.positions-table.toasts.adding-collateral.title')}
                    bodyLines={[]}
                  />
                );
              })
              .catch((error) => {
                let msg = (error?.message ?? error) as string;
                msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
                toast.error(
                  <ToastContent
                    title={t('pages.trade.positions-table.toasts.error-processing.title')}
                    bodyLines={[{ label: t('pages.trade.positions-table.toasts.error-processing.body'), value: msg }]}
                  />
                );
                console.error(error);
              })
              .finally(() => {
                setRequestSent(false);
                setModifyModalOpen(false);
                setSelectedPosition(null);
              });
          });
        })
        .catch((error) => {
          console.error(error);
          setRequestSent(false);
        });
    } else if (modifyType === ModifyTypeE.Remove) {
      if (!maxCollateral || maxCollateral < removeCollateral) {
        return;
      }

      setRequestSent(true);
      getRemoveCollateral(chainId, traderAPIRef.current, selectedPosition.symbol, removeCollateral)
        .then(({ data }) => {
          withdraw(walletClient, data)
            .then((tx) => {
              console.log(`withdraw tx hash: ${tx.hash}`);
              setTxHash(tx.hash);
              toast.success(
                <ToastContent
                  title={t('pages.trade.positions-table.toasts.removing-collateral.title')}
                  bodyLines={[]}
                />
              );
            })
            .catch((error) => {
              console.error(error);
              let msg = (error?.message ?? error) as string;
              msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
              toast.error(
                <ToastContent
                  title={t('pages.trade.positions-table.toasts.error-processing.title')}
                  bodyLines={[{ label: t('pages.trade.positions-table.toasts.error-processing.body'), value: msg }]}
                />
              );
            })
            .finally(() => {
              setRequestSent(false);
              setModifyModalOpen(false);
              setSelectedPosition(null);
            });
        })
        .catch((error) => {
          console.error(error);
          setRequestSent(false);
        });
    }
  }, [
    modifyType,
    selectedPosition,
    requestSent,
    chainId,
    address,
    selectedPool,
    proxyAddr,
    addCollateral,
    removeCollateral,
    maxCollateral,
    walletClient,
    poolTokenDecimals,
    t,
  ]);

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

  useEffect(() => {
    if (!address || !selectedPosition || !chainId || isAPIBusyRef.current) {
      return;
    }

    if (modifyType === ModifyTypeE.Remove) {
      setAPIBusy(true);
      getAvailableMargin(chainId, traderAPIRef.current, selectedPosition.symbol, address).then(({ data }) => {
        setMaxCollateral(data.amount < 0 ? 0 : data.amount);
        setAPIBusy(false);
      });
    } else {
      setMaxCollateral(undefined);
    }
  }, [modifyType, chainId, address, selectedPosition, setAPIBusy]);

  useEffect(() => {
    setNewPositionRisk(null);
  }, [modifyType, addCollateral, removeCollateral]);

  const handleAddCollateralCapture = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddCollateral(+event.target.value);
  }, []);

  const handleRemoveCollateralCapture = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRemoveCollateral(+event.target.value);
  }, []);

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

  // useEffect(() => {
  //   if (!updatedPositionsRef.current && isSDKConnected) {
  //     updatedPositionsRef.current = true;
  //     refreshPositions();
  //   }
  // }, [isSDKConnected, refreshPositions]);

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.POSITIONS]: refreshPositions }));
  }, [refreshPositions, setTableRefreshHandlers]);

  const debouncedAddCollateral = useDebounce(addCollateral, 500);

  const debouncedRemoveCollateral = useDebounce(removeCollateral, 500);

  const handleRefreshPositionRisk = useCallback(async () => {
    if (!selectedPosition || !address || modifyType === ModifyTypeE.Close || isAPIBusyRef.current) {
      return;
    }

    if (modifyType === ModifyTypeE.Add && debouncedAddCollateral === 0) {
      return;
    }

    if (modifyType === ModifyTypeE.Remove && debouncedRemoveCollateral === 0) {
      return;
    }

    setAPIBusy(true);
    await positionRiskOnCollateralAction(
      chainId,
      traderAPIRef.current,
      address,
      modifyType === ModifyTypeE.Add ? debouncedAddCollateral : -debouncedRemoveCollateral,
      selectedPosition
    )
      .then((data) => {
        setAPIBusy(false);
        setNewPositionRisk(data.data.newPositionRisk);
        setMaxCollateral(data.data.availableMargin);
      })
      .catch((err) => {
        console.error(err);
        setAPIBusy(false);
      });
  }, [chainId, address, selectedPosition, modifyType, debouncedAddCollateral, debouncedRemoveCollateral, setAPIBusy]);

  useEffect(() => {
    handleRefreshPositionRisk();
  }, [debouncedAddCollateral, debouncedRemoveCollateral, handleRefreshPositionRisk]);

  const handleMaxCollateral = useCallback(() => {
    if (maxCollateral) {
      setRemoveCollateral(maxCollateral);
    }
  }, [maxCollateral]);

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

  const isConfirmButtonDisabled = useMemo(() => {
    switch (modifyType) {
      case ModifyTypeE.Close:
        return requestSent || !closePositionChecked;
      case ModifyTypeE.Add:
        return requestSent || addCollateral <= 0 || addCollateral < 0;
      case ModifyTypeE.Remove:
        return requestSent || removeCollateral <= 0 || maxCollateral === undefined || maxCollateral < removeCollateral;
      default:
        return false;
    }
  }, [requestSent, modifyType, closePositionChecked, addCollateral, removeCollateral, maxCollateral]);

  const parsedSymbol = useMemo(() => {
    if (selectedPosition) {
      return parseSymbol(selectedPosition.symbol);
    }
    return null;
  }, [selectedPosition]);

  const calculatedPositionSize = useMemo(() => {
    let size;
    if (selectedPosition) {
      switch (modifyType) {
        case ModifyTypeE.Close:
          size = closePositionChecked ? 0 : selectedPosition.positionNotionalBaseCCY;
          break;
        default:
          size = selectedPosition.positionNotionalBaseCCY;
      }
    } else {
      size = 0;
    }
    return formatToCurrency(size, parsedSymbol?.baseCurrency);
  }, [selectedPosition, modifyType, closePositionChecked, parsedSymbol]);

  const calculatedMargin = useMemo(() => {
    let margin;
    if (selectedPosition) {
      switch (modifyType) {
        case ModifyTypeE.Close:
          margin = closePositionChecked ? 0 : selectedPosition.collateralCC;
          break;
        case ModifyTypeE.Add:
          margin = selectedPosition.collateralCC + addCollateral;
          break;
        case ModifyTypeE.Remove:
          margin = selectedPosition.collateralCC - removeCollateral;
          break;
        default:
          margin = selectedPosition.collateralCC;
      }
    } else {
      margin = 0;
    }
    return formatToCurrency(margin, parsedSymbol?.poolSymbol);
  }, [selectedPosition, modifyType, closePositionChecked, parsedSymbol, addCollateral, removeCollateral]);

  const calculatedLeverage = useMemo(() => {
    if (!selectedPosition) {
      return '-';
    }

    if (modifyType === ModifyTypeE.Close && closePositionChecked) {
      return '-';
    }

    if (modifyType === ModifyTypeE.Add || modifyType === ModifyTypeE.Remove) {
      if (!newPositionRisk) {
        return '-';
      } else {
        return `${formatNumber(newPositionRisk.leverage)}x`;
      }
    }

    return `${formatNumber(selectedPosition.leverage)}x`;
  }, [selectedPosition, newPositionRisk, modifyType, closePositionChecked]);

  const calculatedLiqPrice = useMemo(() => {
    if (!selectedPosition || selectedPosition.liquidationPrice[0] <= 0) {
      return '-';
    }

    if (modifyType === ModifyTypeE.Close && closePositionChecked) {
      return '-';
    }

    if (modifyType === ModifyTypeE.Add || modifyType === ModifyTypeE.Remove) {
      if (!newPositionRisk || newPositionRisk.liquidationPrice[0] <= 0) {
        return '-';
      } else {
        return formatToCurrency(newPositionRisk.liquidationPrice[0], parsedSymbol?.quoteCurrency);
      }
    }

    return formatToCurrency(selectedPosition.liquidationPrice[0], parsedSymbol?.quoteCurrency);
  }, [selectedPosition, newPositionRisk, modifyType, closePositionChecked, parsedSymbol]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  }, []);

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
          />
        </Box>
      )}
      <Dialog open={isModifyModalOpen} className={styles.dialog}>
        <DialogTitle>{t('pages.trade.positions-table.modify-modal.title')}</DialogTitle>
        <DialogContent>
          <ModifyTypeSelector modifyType={modifyType} setModifyType={setModifyType} />
          <Box className={styles.inputBlock}>
            {modifyType === ModifyTypeE.Close && (
              <FormControlLabel
                id="confirm-close"
                value="true"
                defaultChecked={closePositionChecked}
                onChange={(_event, checked) => setClosePositionChecked(checked)}
                control={closePositionChecked ? <Checkbox checked={true} /> : <Checkbox checked={false} />}
                label={t('pages.trade.positions-table.modify-modal.close')}
                labelPlacement="end"
                className={styles.formControlLabel}
              />
            )}
            {modifyType === ModifyTypeE.Add && (
              <SidesRow
                leftSide={t('pages.trade.positions-table.modify-modal.add')}
                rightSide={
                  <OutlinedInput
                    id="add-collateral"
                    endAdornment={
                      <InputAdornment position="end">
                        <Typography variant="adornment">{selectedPool?.poolSymbol}</Typography>
                      </InputAdornment>
                    }
                    type="number"
                    inputProps={{ step: 0.1, min: 0 }}
                    defaultValue={addCollateral}
                    onChange={handleAddCollateralCapture}
                  />
                }
              />
            )}
            {modifyType === ModifyTypeE.Remove && (
              <Box>
                <SidesRow
                  leftSide={t('pages.trade.positions-table.modify-modal.remove')}
                  rightSide={
                    <FormControl variant="outlined">
                      <OutlinedInput
                        id="remove-collateral"
                        endAdornment={
                          <InputAdornment position="end">
                            <Typography variant="adornment">{selectedPool?.poolSymbol}</Typography>
                          </InputAdornment>
                        }
                        type="number"
                        inputProps={{ step: 0.1, min: 0, max: maxCollateral }}
                        value={removeCollateral}
                        onChange={handleRemoveCollateralCapture}
                      />
                    </FormControl>
                  }
                />
                <SidesRow
                  leftSide=" "
                  rightSide={
                    maxCollateral && (
                      <Typography className={styles.helperText} variant="bodyTiny">
                        Max: <Link onClick={handleMaxCollateral}>{formatNumber(maxCollateral)}</Link>
                      </Typography>
                    )
                  }
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <Separator />
        <DialogContent>
          <Box className={styles.newPositionHeader}>
            <Typography variant="bodyMedium" className={styles.centered}>
              {t('pages.trade.positions-table.modify-modal.pos-details.title')}
            </Typography>
          </Box>
          <Box className={styles.newPositionDetails}>
            <SidesRow
              leftSide={t('pages.trade.positions-table.modify-modal.pos-details.size')}
              rightSide={calculatedPositionSize}
            />
            <SidesRow
              leftSide={t('pages.trade.positions-table.modify-modal.pos-details.margin')}
              rightSide={calculatedMargin}
            />
            <SidesRow
              leftSide={t('pages.trade.positions-table.modify-modal.pos-details.leverage')}
              rightSide={calculatedLeverage}
            />
            <SidesRow
              leftSide={t('pages.trade.positions-table.modify-modal.pos-details.liq-price')}
              rightSide={calculatedLiqPrice}
            />
          </Box>
        </DialogContent>
        <Separator />
        <DialogActions>
          <Button onClick={closeModifyModal} variant="secondary" size="small">
            {t('pages.trade.positions-table.modify-modal.cancel')}
          </Button>
          <Button
            onClick={handleModifyPositionConfirm}
            variant="primary"
            size="small"
            disabled={isConfirmButtonDisabled}
          >
            {t('pages.trade.positions-table.modify-modal.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

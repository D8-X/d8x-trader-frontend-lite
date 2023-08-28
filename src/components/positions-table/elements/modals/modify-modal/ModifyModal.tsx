import { useAtom } from 'jotai';
import { ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useWaitForTransaction, useWalletClient } from 'wagmi';

import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  Link,
  OutlinedInput,
  Typography,
} from '@mui/material';

import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { deposit } from 'blockchain-api/contract-interactions/deposit';
import { withdraw } from 'blockchain-api/contract-interactions/withdraw';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { parseSymbol } from 'helpers/parseSymbol';
import { useDebounce } from 'helpers/useDebounce';
import {
  getAddCollateral,
  getAvailableMargin,
  getRemoveCollateral,
  positionRiskOnCollateralAction,
} from 'network/network';
import {
  poolTokenDecimalsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  traderAPIAtom,
  traderAPIBusyAtom,
} from 'store/pools.store';
import { formatNumber } from 'utils/formatNumber';
import { formatToCurrency } from 'utils/formatToCurrency';
import type { AddressT, MarginAccountI } from 'types/types';

import { ModifyTypeE, ModifyTypeSelector } from '../../modify-type-selector/ModifyTypeSelector';

import styles from '../Modal.module.scss';
import { sdkConnectedAtom } from '../../../../../store/vault-pools.store';

interface ModifyModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountI | null;
  closeModal: () => void;
}

export const ModifyModal = memo(({ isOpen, selectedPosition, closeModal }: ModifyModalPropsI) => {
  const { t } = useTranslation();

  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [isAPIBusy, setAPIBusy] = useAtom(traderAPIBusyAtom);
  const [poolTokenDecimals] = useAtom(poolTokenDecimalsAtom);

  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: chainId });

  const [requestSent, setRequestSent] = useState(false);
  const [modifyType, setModifyType] = useState(ModifyTypeE.Add);
  const [txHashForAdd, setTxHashForAdd] = useState<AddressT | undefined>(undefined);
  const [amountForAdd, setAmountForAdd] = useState(0);
  const [txHashForRemove, setTxHashForRemove] = useState<AddressT | undefined>(undefined);
  const [amountForRemove, setAmountForRemove] = useState(0);
  const [symbolForTx, setSymbolForTx] = useState('');
  const [newPositionRisk, setNewPositionRisk] = useState<MarginAccountI | null>();
  const [addCollateral, setAddCollateral] = useState(0);
  const [removeCollateral, setRemoveCollateral] = useState(0);
  const [maxCollateral, setMaxCollateral] = useState<number>();

  const traderAPIRef = useRef(traderAPI);
  const isAPIBusyRef = useRef(isAPIBusy);
  const requestSentRef = useRef(false);

  useWaitForTransaction({
    hash: txHashForAdd,
    onSuccess() {
      toast.success(
        <ToastContent
          title={t('pages.trade.positions-table.toasts.collateral-added.title')}
          bodyLines={[
            {
              label: t('pages.trade.positions-table.toasts.collateral-added.body1'),
              value: symbolForTx,
            },
            {
              label: t('pages.trade.positions-table.toasts.collateral-added.body2'),
              value: formatNumber(amountForAdd),
            },
          ]}
        />
      );
    },
    onError(reason) {
      toast.error(
        <ToastContent
          title={t('pages.trade.positions-table.toasts.tx-failed.title')}
          bodyLines={[{ label: t('pages.trade.positions-table.toasts.tx-failed.body'), value: reason.message }]}
        />
      );
    },
    onSettled() {
      setTxHashForAdd(undefined);
      setAmountForAdd(0);
      setSymbolForTx('');
    },
    enabled: !!address && !!txHashForAdd,
  });

  useWaitForTransaction({
    hash: txHashForRemove,
    onSuccess(data) {
      console.log({ data });
      toast.success(
        <ToastContent
          title={t('pages.trade.positions-table.toasts.collateral-removed.title')}
          bodyLines={[
            {
              label: t('pages.trade.positions-table.toasts.collateral-removed.body1'),
              value: symbolForTx,
            },
            {
              label: t('pages.trade.positions-table.toasts.collateral-removed.body2'),
              value: formatNumber(amountForRemove),
            },
          ]}
        />
      );
    },
    onError(reason) {
      toast.error(
        <ToastContent
          title={t('pages.trade.positions-table.toasts.tx-failed.title')}
          bodyLines={[{ label: t('pages.trade.positions-table.toasts.tx-failed.body'), value: reason.message }]}
        />
      );
    },
    onSettled() {
      setTxHashForRemove(undefined);
      setAmountForRemove(0);
      setSymbolForTx('');
    },
    enabled: !!address && !!txHashForRemove,
  });

  const handleMaxCollateral = useCallback(() => {
    if (maxCollateral) {
      setRemoveCollateral(maxCollateral);
    }
  }, [maxCollateral]);

  const handleAddCollateralCapture = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddCollateral(+event.target.value);
  }, []);

  const handleRemoveCollateralCapture = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRemoveCollateral(+event.target.value);
  }, []);

  const debouncedAddCollateral = useDebounce(addCollateral, 500);

  const debouncedRemoveCollateral = useDebounce(removeCollateral, 500);

  const handleRefreshPositionRisk = useCallback(async () => {
    if (!selectedPosition || !address || isAPIBusyRef.current) {
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
    if (isSDKConnected) {
      traderAPIRef.current = traderAPI;
    }
  }, [traderAPI, isSDKConnected]);

  useEffect(() => {
    handleRefreshPositionRisk().then();
  }, [debouncedAddCollateral, debouncedRemoveCollateral, handleRefreshPositionRisk]);

  useEffect(() => {
    setAddCollateral(0);
    setRemoveCollateral(0);
    setModifyType(ModifyTypeE.Add);
  }, [isOpen]);

  useEffect(() => {
    setNewPositionRisk(null);
  }, [modifyType, addCollateral, removeCollateral]);

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

  const parsedSymbol = useMemo(() => {
    if (selectedPosition) {
      return parseSymbol(selectedPosition.symbol);
    }
    return null;
  }, [selectedPosition]);

  const calculatedPositionSize = useMemo(() => {
    const size = selectedPosition ? selectedPosition.positionNotionalBaseCCY : 0;
    return formatToCurrency(size, parsedSymbol?.baseCurrency);
  }, [selectedPosition, parsedSymbol]);

  const calculatedMargin = useMemo(() => {
    let margin;
    if (selectedPosition) {
      switch (modifyType) {
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
  }, [selectedPosition, modifyType, parsedSymbol, addCollateral, removeCollateral]);

  const calculatedLeverage = useMemo(() => {
    if (!selectedPosition) {
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
  }, [selectedPosition, newPositionRisk, modifyType]);

  const calculatedLiqPrice = useMemo(() => {
    if (!selectedPosition || selectedPosition.liquidationPrice[0] <= 0) {
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
  }, [selectedPosition, newPositionRisk, modifyType, parsedSymbol]);

  const isConfirmButtonDisabled = useMemo(() => {
    switch (modifyType) {
      case ModifyTypeE.Add:
        return requestSent || addCollateral <= 0 || addCollateral < 0;
      case ModifyTypeE.Remove:
        return requestSent || removeCollateral <= 0 || maxCollateral === undefined || maxCollateral < removeCollateral;
      default:
        return false;
    }
  }, [requestSent, modifyType, addCollateral, removeCollateral, maxCollateral]);

  const handleModifyPositionConfirm = useCallback(async () => {
    if (requestSentRef.current) {
      return;
    }

    if (!selectedPosition || !address || !selectedPool || !proxyAddr || !walletClient || !poolTokenDecimals) {
      return;
    }

    if (modifyType === ModifyTypeE.Add) {
      requestSentRef.current = true;
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
                setTxHashForAdd(tx.hash);
                setAmountForAdd(addCollateral);
                setSymbolForTx(selectedPosition.symbol);
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
                requestSentRef.current = false;
                setRequestSent(false);
                closeModal();
              });
          });
        })
        .catch((error) => {
          console.error(error);
          setRequestSent(false);
          requestSentRef.current = false;
        });
    } else if (modifyType === ModifyTypeE.Remove) {
      if (!maxCollateral || maxCollateral < removeCollateral) {
        return;
      }

      requestSentRef.current = true;
      setRequestSent(true);
      getRemoveCollateral(chainId, traderAPIRef.current, selectedPosition.symbol, removeCollateral)
        .then(({ data }) => {
          withdraw(walletClient, data)
            .then((tx) => {
              console.log(`withdraw tx hash: ${tx.hash}`);
              setTxHashForRemove(tx.hash);
              setAmountForRemove(removeCollateral);
              setSymbolForTx(selectedPosition.symbol);
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
              requestSentRef.current = false;
              closeModal();
            });
        })
        .catch((error) => {
          console.error(error);
          requestSentRef.current = false;
          setRequestSent(false);
        });
    }
  }, [
    modifyType,
    selectedPosition,
    chainId,
    address,
    selectedPool,
    proxyAddr,
    addCollateral,
    removeCollateral,
    maxCollateral,
    walletClient,
    poolTokenDecimals,
    closeModal,
    t,
  ]);

  return (
    <Dialog open={isOpen} className={styles.root}>
      <DialogTitle>{t('pages.trade.positions-table.modify-modal.title')}</DialogTitle>
      <DialogContent>
        <ModifyTypeSelector modifyType={modifyType} setModifyType={setModifyType} />
        <Box className={styles.inputBlock}>
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
        <Button onClick={closeModal} variant="secondary" size="small">
          {t('pages.trade.positions-table.modify-modal.cancel')}
        </Button>
        <Button onClick={handleModifyPositionConfirm} variant="primary" size="small" disabled={isConfirmButtonDisabled}>
          {t('pages.trade.positions-table.modify-modal.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

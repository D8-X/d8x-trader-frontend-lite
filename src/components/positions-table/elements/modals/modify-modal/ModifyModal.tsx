import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, CircularProgress, FormControl, InputAdornment, Link, OutlinedInput, Typography } from '@mui/material';

import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { deposit } from 'blockchain-api/contract-interactions/deposit';
import { withdraw } from 'blockchain-api/contract-interactions/withdraw';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { SeparatorTypeE } from 'components/separator/enums';
import { Separator } from 'components/separator/Separator';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { parseSymbol } from 'helpers/parseSymbol';
import { useDebounce } from 'helpers/useDebounce';
import { useDebouncedEffect } from 'helpers/useDebouncedEffect';
import { getAvailableMargin, positionRiskOnCollateralAction } from 'network/network';
import {
  collateralToSettleConversionAtom,
  flatTokenAtom,
  proxyAddrAtom,
  traderAPIAtom,
  traderAPIBusyAtom,
  triggerBalancesUpdateAtom,
} from 'store/pools.store';
import type { MarginAccountI, PoolWithIdI } from 'types/types';
import { formatNumber } from 'utils/formatNumber';
import { formatToCurrency, valueToFractionDigits } from 'utils/formatToCurrency';
import { isEnabledChain } from 'utils/isEnabledChain';

import { useSettleTokenBalance } from '../../../hooks/useSettleTokenBalance';
import { ModifyTypeE, ModifyTypeSelector } from '../../modify-type-selector/ModifyTypeSelector';

import { useSendTransaction } from '@privy-io/react-auth';
import { smartAccountClientAtom } from 'store/app.store';
import styles from '../Modal.module.scss';

interface ModifyModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountI | null;
  poolByPosition?: PoolWithIdI | null;
  closeModal: () => void;
}

export const ModifyModal = memo(({ isOpen, selectedPosition, poolByPosition, closeModal }: ModifyModalPropsI) => {
  const { t } = useTranslation();

  const proxyAddr = useAtomValue(proxyAddrAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const smartAccountClient = useAtomValue(smartAccountClientAtom);
  const c2s = useAtomValue(collateralToSettleConversionAtom);
  const flatToken = useAtomValue(flatTokenAtom);
  const setTriggerBalancesUpdate = useSetAtom(triggerBalancesUpdateAtom);
  const [isAPIBusy, setAPIBusy] = useAtom(traderAPIBusyAtom);

  const { address, chain, chainId } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId });
  const { sendTransaction } = useSendTransaction();

  const [requestSent, setRequestSent] = useState(false);
  const [modifyType, setModifyType] = useState(ModifyTypeE.Add);
  const [txHashForAdd, setTxHashForAdd] = useState<Address | undefined>(undefined);
  const [amountForAdd, setAmountForAdd] = useState(0);
  const [txHashForRemove, setTxHashForRemove] = useState<Address | undefined>(undefined);
  const [amountForRemove, setAmountForRemove] = useState(0);
  const [symbolForTx, setSymbolForTx] = useState('');
  const [newPositionRisk, setNewPositionRisk] = useState<MarginAccountI | null>();
  const [addCollateral, setAddCollateral] = useState('0');
  const [removeCollateral, setRemoveCollateral] = useState('0');
  const [availableMargin, setAvailableMargin] = useState<number>();
  const [maxCollateral, setMaxCollateral] = useState<number>();
  const [loading, setLoading] = useState(false);

  const isAPIBusyRef = useRef(isAPIBusy);
  const requestSentRef = useRef(false);
  const lastApiCallTime = useRef(0);

  const [userPrice, userSymbol] =
    !!flatToken && poolByPosition?.poolId === flatToken.poolId && !!flatToken.registeredSymbol
      ? [flatToken.compositePrice ?? 1, flatToken.registeredSymbol]
      : [1, poolByPosition?.settleSymbol];

  const { settleTokenBalance, settleTokenDecimals } = useSettleTokenBalance({ poolByPosition });

  const {
    isSuccess: isAddSuccess,
    isError: isAddError,
    isFetched: isAddFetched,
    error: addReason,
  } = useWaitForTransactionReceipt({
    hash: txHashForAdd,
    query: { enabled: !!address && !!txHashForAdd },
  });

  useEffect(() => {
    if (!isAddFetched) {
      return;
    }
    setTxHashForAdd(undefined);
    setAmountForAdd(0);
    setSymbolForTx('');
    setLoading(false);
  }, [isAddFetched]);

  useEffect(() => {
    if (!isAddError || !addReason) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('pages.trade.positions-table.toasts.tx-failed.title')}
        bodyLines={[{ label: t('pages.trade.positions-table.toasts.tx-failed.body'), value: addReason.message }]}
      />
    );
  });

  useEffect(() => {
    if (!isAddSuccess || !txHashForAdd) {
      return;
    }
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
          {
            label: '',
            value: (
              <a
                href={getTxnLink(chain?.blockExplorers?.default?.url, txHashForAdd)}
                target="_blank"
                rel="noreferrer"
                className={styles.shareLink}
              >
                {txHashForAdd}
              </a>
            ),
          },
        ]}
      />
    );
    setTriggerBalancesUpdate((prevValue) => !prevValue);
  }, [isAddSuccess, txHashForAdd, amountForAdd, chain, symbolForTx, t, setTriggerBalancesUpdate]);

  const {
    isSuccess: isRemoveSuccess,
    isError: isRemoveError,
    isFetched: isRemoveFetched,
    error: removeReason,
  } = useWaitForTransactionReceipt({
    hash: txHashForRemove,
    query: { enabled: !!address && !!txHashForRemove },
  });

  useEffect(() => {
    if (!isRemoveFetched) {
      return;
    }
    setTxHashForRemove(undefined);
    setAmountForRemove(0);
    setSymbolForTx('');
    setLoading(false);
  }, [isRemoveFetched]);

  useEffect(() => {
    if (!isRemoveError || !removeReason) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('pages.trade.positions-table.toasts.tx-failed.title')}
        bodyLines={[{ label: t('pages.trade.positions-table.toasts.tx-failed.body'), value: removeReason.message }]}
      />
    );
  }, [isRemoveError, removeReason, t]);

  useEffect(() => {
    if (!isRemoveSuccess || !txHashForRemove) {
      return;
    }
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
          {
            label: '',
            value: (
              <a
                href={getTxnLink(chain?.blockExplorers?.default?.url, txHashForRemove)}
                target="_blank"
                rel="noreferrer"
                className={styles.shareLink}
              >
                {txHashForRemove}
              </a>
            ),
          },
        ]}
      />
    );
    setTimeout(() => {
      setTriggerBalancesUpdate((prevValue) => !prevValue);
    }, 5000);
  }, [isRemoveSuccess, txHashForRemove, amountForRemove, chain, symbolForTx, t, setTriggerBalancesUpdate]);

  const debouncedAddCollateral = useDebounce(addCollateral, 500);

  const debouncedRemoveCollateral = useDebounce(removeCollateral, 500);

  useEffect(() => {
    isAPIBusyRef.current = isAPIBusy;
  }, [isAPIBusy]);

  const handleRefreshPositionRisk = useCallback(() => {
    if (isAPIBusyRef.current || !selectedPosition || !address || !isEnabledChain(chainId)) {
      return;
    }

    if (modifyType === ModifyTypeE.Add && debouncedAddCollateral === '0') {
      return;
    }

    if (modifyType === ModifyTypeE.Remove && debouncedRemoveCollateral === '0') {
      return;
    }
    const px = (poolByPosition ? c2s.get(poolByPosition.poolSymbol)?.value : 1) ?? 1;

    setAPIBusy(true);
    positionRiskOnCollateralAction(
      chainId,
      traderAPI,
      address,
      modifyType === ModifyTypeE.Add ? +debouncedAddCollateral / px : -debouncedRemoveCollateral / px,
      selectedPosition
    )
      .then((data) => {
        setAPIBusy(false);
        setNewPositionRisk(data.data.newPositionRisk);
        setAvailableMargin(data.data.availableMargin < 0 ? 0 : data.data.availableMargin * 0.99);
      })
      .catch((err) => {
        console.error(err);
        setAPIBusy(false);
      });
  }, [
    chainId,
    c2s,
    address,
    selectedPosition,
    modifyType,
    debouncedAddCollateral,
    debouncedRemoveCollateral,
    setAPIBusy,
    traderAPI,
    poolByPosition,
  ]);

  useDebouncedEffect(
    () => {
      handleRefreshPositionRisk();
    },
    [debouncedAddCollateral, debouncedRemoveCollateral, handleRefreshPositionRisk],
    1000
  );

  useEffect(() => {
    if (availableMargin && poolByPosition) {
      setMaxCollateral(availableMargin * (c2s.get(poolByPosition.poolSymbol)?.value ?? 1));
    } else {
      setMaxCollateral(undefined);
    }
  }, [poolByPosition, availableMargin, c2s]);

  useEffect(() => {
    setAddCollateral('0');
    setRemoveCollateral('0');
    setModifyType(ModifyTypeE.Add);
  }, [isOpen]);

  useEffect(() => {
    setNewPositionRisk(null);
  }, [modifyType, addCollateral, removeCollateral]);

  useEffect(() => {
    if (!address || !selectedPosition?.symbol || !isEnabledChain(chainId) || isAPIBusy) {
      return;
    }

    if (modifyType === ModifyTypeE.Remove) {
      const now = Date.now();
      if (now - lastApiCallTime.current < 3000) {
        return;
      }

      lastApiCallTime.current = now;
      setAPIBusy(true);

      getAvailableMargin(chainId, traderAPI, selectedPosition.symbol, address)
        .then(({ data }) => {
          setAvailableMargin(data.amount < 0 ? 0 : data.amount * 0.99);
        })
        .catch((error) => {
          console.error(error);
          setAvailableMargin(undefined);
        })
        .finally(() => {
          setAPIBusy(false);
        });
    } else {
      setAvailableMargin(undefined);
    }
  }, [modifyType, chainId, address, selectedPosition?.symbol, setAPIBusy, traderAPI, isAPIBusy]);

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
    const px = poolByPosition ? (c2s.get(poolByPosition.poolSymbol)?.value ?? 1) * userPrice : 1;
    if (selectedPosition) {
      switch (modifyType) {
        case ModifyTypeE.Add:
          margin = selectedPosition.collateralCC + +addCollateral / px;
          break;
        case ModifyTypeE.Remove:
          margin = selectedPosition.collateralCC - +removeCollateral / px;
          break;
        default:
          margin = selectedPosition.collateralCC;
      }
    } else {
      margin = 0;
    }
    return poolByPosition
      ? formatToCurrency(margin * (c2s.get(poolByPosition.poolSymbol)?.value ?? 1) * userPrice, userSymbol)
      : '-';
  }, [c2s, userPrice, userSymbol, selectedPosition, poolByPosition, modifyType, addCollateral, removeCollateral]);

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
        return loading || requestSent || +addCollateral <= 0 || +addCollateral < 0;
      case ModifyTypeE.Remove:
        return (
          loading ||
          requestSent ||
          +removeCollateral <= 0 ||
          maxCollateral === undefined ||
          maxCollateral < +removeCollateral
        );
      default:
        return false;
    }
  }, [requestSent, modifyType, addCollateral, removeCollateral, maxCollateral, loading]);

  const handleModifyPositionConfirm = async () => {
    if (requestSentRef.current) {
      return;
    }

    if (
      !selectedPosition ||
      !address ||
      !traderAPI ||
      !poolByPosition ||
      !proxyAddr ||
      !walletClient ||
      !smartAccountClient ||
      !settleTokenDecimals ||
      !isEnabledChain(chainId)
    ) {
      return;
    }
    const px = poolByPosition ? (c2s.get(poolByPosition.poolSymbol)?.value ?? 1) * userPrice : 1;

    if (modifyType === ModifyTypeE.Add) {
      requestSentRef.current = true;
      setRequestSent(true);
      setLoading(true);
      approveMarginToken({
        walletClient: smartAccountClient,
        sendTransaction,
        settleTokenAddr: poolByPosition.settleTokenAddr,
        proxyAddr,
        minAmount: +addCollateral / px,
        decimals: settleTokenDecimals,
        registeredToken: flatToken?.registeredToken,
      })
        .then(() => {
          deposit(sendTransaction, traderAPI, {
            traderAddr: address,
            amount: +addCollateral / px,
            symbol: selectedPosition.symbol,
          })
            .then((tx) => {
              setTxHashForAdd(tx.hash);
              setAmountForAdd(+addCollateral);
              setSymbolForTx(selectedPosition.symbol);
              setTriggerBalancesUpdate((prevValue) => !prevValue);
              toast.success(
                <ToastContent title={t('pages.trade.positions-table.toasts.adding-collateral.title')} bodyLines={[]} />
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
              setLoading(false);
            })
            .finally(() => {
              requestSentRef.current = false;
              setRequestSent(false);
              closeModal();
            });
        })
        .catch((error) => {
          console.error(error);
          setLoading(false);
          requestSentRef.current = false;
          setRequestSent(false);
        });
    } else if (modifyType === ModifyTypeE.Remove) {
      if (!maxCollateral || maxCollateral < +removeCollateral) {
        return;
      }

      requestSentRef.current = true;
      setRequestSent(true);
      setLoading(true);
      withdraw(sendTransaction, traderAPI, {
        traderAddr: address,
        amount: +removeCollateral,
        symbol: selectedPosition.symbol,
      })
        .then(({ hash }) => {
          setTxHashForRemove(hash);
          setAmountForRemove(+removeCollateral);
          setSymbolForTx(selectedPosition.symbol);
          setTriggerBalancesUpdate((prevValue) => !prevValue);
          toast.success(
            <ToastContent title={t('pages.trade.positions-table.toasts.removing-collateral.title')} bodyLines={[]} />
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
          setLoading(false);
        })
        .finally(() => {
          setRequestSent(false);
          requestSentRef.current = false;
          closeModal();
        });
    }
  };

  if (!selectedPosition) {
    return null;
  }

  const unroundedMaxAddValue = settleTokenBalance ? settleTokenBalance : 1;
  const unroundedMaxRemoveValue = maxCollateral ? maxCollateral : 1;
  const digitsForMaxAdd = valueToFractionDigits(unroundedMaxAddValue);
  const digitsForMaxRemove = valueToFractionDigits(unroundedMaxRemoveValue);

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      onCloseClick={closeModal}
      className={styles.root}
      dialogTitle={t('pages.trade.positions-table.modify-modal.title')}
      footerActions={
        <>
          <Button onClick={closeModal} variant="secondary" size="small">
            {t('pages.trade.positions-table.modify-modal.cancel')}
          </Button>
          <GasDepositChecker>
            <Button
              onClick={handleModifyPositionConfirm}
              variant="primary"
              size="small"
              disabled={isConfirmButtonDisabled}
            >
              {loading && <CircularProgress size="24px" sx={{ mr: 2 }} />}
              {t('pages.trade.positions-table.modify-modal.confirm')}
            </Button>
          </GasDepositChecker>
        </>
      }
    >
      <ModifyTypeSelector modifyType={modifyType} setModifyType={setModifyType} />
      <div className={styles.inputBlock}>
        {modifyType === ModifyTypeE.Add && (
          <>
            <SidesRow
              leftSide={t('pages.trade.positions-table.modify-modal.add')}
              rightSide={
                <OutlinedInput
                  id="add-collateral"
                  endAdornment={
                    <InputAdornment position="end">
                      <Typography variant="adornment">{userSymbol}</Typography>
                    </InputAdornment>
                  }
                  type="number"
                  inputProps={{ step: 0.01, min: 0, max: (settleTokenBalance ?? 0) / userPrice }}
                  value={addCollateral}
                  onChange={(event) => setAddCollateral(event.target.value)}
                />
              }
            />
            {settleTokenBalance !== undefined && settleTokenBalance > 0 && (
              <SidesRow
                leftSide=" "
                rightSide={
                  <Typography className={styles.helperText} variant="bodyTiny">
                    {t('common.max')}{' '}
                    <Link onClick={() => setAddCollateral((settleTokenBalance / userPrice).toFixed(digitsForMaxAdd))}>
                      {(settleTokenBalance / userPrice).toFixed(digitsForMaxAdd)}
                    </Link>
                  </Typography>
                }
              />
            )}
          </>
        )}
        {modifyType === ModifyTypeE.Remove && (
          <>
            <SidesRow
              leftSide={t('pages.trade.positions-table.modify-modal.remove')}
              rightSide={
                <FormControl variant="outlined">
                  <OutlinedInput
                    id="remove-collateral"
                    endAdornment={
                      <InputAdornment position="end">
                        <Typography variant="adornment">{userSymbol}</Typography>
                      </InputAdornment>
                    }
                    type="number"
                    inputProps={{ step: 0.01, min: 0, max: (maxCollateral ?? 0) / userPrice }}
                    value={removeCollateral}
                    onChange={(event) => setRemoveCollateral(event.target.value)}
                  />
                </FormControl>
              }
            />
            {maxCollateral !== null && maxCollateral !== undefined && (
              <SidesRow
                leftSide=" "
                rightSide={
                  <Typography className={styles.helperText} variant="bodyTiny">
                    {t('common.max')}{' '}
                    <Link onClick={() => setRemoveCollateral((maxCollateral / userPrice).toFixed(digitsForMaxRemove))}>
                      {(maxCollateral / userPrice).toFixed(digitsForMaxRemove)}
                    </Link>
                  </Typography>
                }
              />
            )}
          </>
        )}
      </div>
      <Separator separatorType={SeparatorTypeE.Modal} />
      <div className={styles.newPositionHeader}>
        <Typography variant="bodyMedium" className={styles.centered}>
          {t('pages.trade.positions-table.modify-modal.pos-details.title')}
        </Typography>
      </div>
      <div className={styles.newPositionDetails}>
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
      </div>
    </Dialog>
  );
});

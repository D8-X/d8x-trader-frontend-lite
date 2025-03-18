import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, CircularProgress, InputAdornment, Link, OutlinedInput, Typography } from '@mui/material';

import SwitchIcon from 'assets/icons/switchSeparator.svg?react';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { addLiquidity } from 'blockchain-api/contract-interactions/addLiquidity';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { getTxnLink } from 'helpers/getTxnLink';
import { depositModalOpenAtom } from 'store/global-modals.store';
import {
  collateralToSettleConversionAtom,
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  traderAPIAtom,
  flatTokenAtom,
} from 'store/pools.store';
import {
  dCurrencyPriceAtom,
  sdkConnectedAtom,
  triggerAddInputFocusAtom,
  triggerUserStatsUpdateAtom,
} from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';
import { isEnabledChain } from 'utils/isEnabledChain';

import styles from './Action.module.scss';

const ADD_INPUT_FIELD_ID = 'add-amount-size';
const DELAY_FOR_SCROLL = 100;

enum ValidityCheckAddE {
  Empty = '-',
  NoFunds = 'no-funds',
  NoAmount = 'no-amount',
  WrongNetwork = 'wrong-network',
  NoAddress = 'not-connected',
  AmountTooBig = 'amount-too-big',
  AmountBelowMinimum = 'amount-below-min',
  GoodToGo = 'good-to-go',
}

export const Add = memo(() => {
  const { t } = useTranslation();

  const { address, chain, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { isMultisigAddress } = useUserWallet();

  const proxyAddr = useAtomValue(proxyAddrAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const liqProvTool = useAtomValue(traderAPIAtom);
  const dCurrencyPrice = useAtomValue(dCurrencyPriceAtom);
  const isSDKConnected = useAtomValue(sdkConnectedAtom);
  const poolTokenDecimals = useAtomValue(poolTokenDecimalsAtom);
  const poolTokenBalance = useAtomValue(poolTokenBalanceAtom);
  const triggerAddInputFocus = useAtomValue(triggerAddInputFocusAtom);
  const flatToken = useAtomValue(flatTokenAtom);
  const c2s = useAtomValue(collateralToSettleConversionAtom);
  const setTriggerUserStatsUpdate = useSetAtom(triggerUserStatsUpdateAtom);
  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);

  const [addAmount, setAddAmount] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const [inputValue, setInputValue] = useState(`${addAmount}`);
  const [txHash, setTxHash] = useState<Address>();
  const [loading, setLoading] = useState(false);
  const [approvalCompleted, setApprovalCompleted] = useState(false);

  const requestSentRef = useRef(false);
  const inputValueChangedRef = useRef(false);
  const triggerFocusStateRef = useRef(true);

  const [userPrice, userSymbol] =
    !!flatToken && selectedPool?.poolId === flatToken.poolId
      ? [flatToken.compositePrice ?? 1, flatToken.registeredSymbol ?? flatToken.supportedTokens[0].symbol]
      : [1, selectedPool?.settleSymbol ?? ''];

  const handleInputCapture = useCallback((orderSizeValue: string) => {
    if (orderSizeValue) {
      setAddAmount(+orderSizeValue);
      setInputValue(orderSizeValue);
    } else {
      setAddAmount(0);
      setInputValue('');
    }
    inputValueChangedRef.current = true;
  }, []);

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${addAmount}`);
    }
    inputValueChangedRef.current = false;
  }, [addAmount]);

  const {
    isSuccess,
    isError,
    isFetched,
    error: reason,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  useEffect(() => {
    if (!isFetched || !txHash) {
      return;
    }
    setTxHash(undefined);
    setLoading(false);
    setTriggerUserStatsUpdate((prevValue) => !prevValue);
  }, [isFetched, txHash, setTriggerUserStatsUpdate]);

  useEffect(() => {
    if (!isError || !reason || !txHash) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('pages.vault.toast.error.title')}
        bodyLines={[{ label: t('pages.vault.toast.error.body'), value: reason.message }]}
      />
    );
  }, [isError, txHash, reason, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    toast.success(
      <ToastContent
        title={t('pages.vault.toast.added')}
        bodyLines={[
          {
            label: '',
            value: (
              <a
                href={getTxnLink(chain?.blockExplorers?.default?.url, txHash)}
                target="_blank"
                rel="noreferrer"
                className={styles.shareLink}
              >
                {txHash}
              </a>
            ),
          },
        ]}
      />
    );
    setAddAmount(0);
    setInputValue('0');
  }, [isSuccess, txHash, chain, t]);

  const handleApprove = () => {
    if (requestSentRef.current) {
      return;
    }

    if (!isSDKConnected || !selectedPool || !addAmount || addAmount < 0 || !poolTokenDecimals) {
      return;
    }

    if (!address || !walletClient || !proxyAddr) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);
    setLoading(true);
    approveMarginToken({
      walletClient,
      settleTokenAddr: selectedPool.settleTokenAddr,
      isMultisigAddress,
      proxyAddr,
      minAmount: addAmount / 1.05 / userPrice,
      decimals: poolTokenDecimals,
      registeredToken: flatToken?.registeredToken,
    })
      .then(() => {
        setApprovalCompleted(true);
        setLoading(false);
        toast.success(<ToastContent title={t('pages.vault.toast.approved')} bodyLines={[]} />);
      })
      .catch((err) => {
        console.error(err);
        let msg = (err?.message ?? err) as string;
        msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
        toast.error(
          <ToastContent
            title={t('pages.vault.toast.error.title')}
            bodyLines={[{ label: t('pages.vault.toast.error.body'), value: msg }]}
          />
        );
        setLoading(false);
      })
      .finally(() => {
        requestSentRef.current = false;
        setRequestSent(false);
      });
  };

  const handleAddLiquidity = () => {
    if (requestSentRef.current) {
      return;
    }

    if (!liqProvTool || !isSDKConnected || !selectedPool || !addAmount || addAmount < 0 || !poolTokenDecimals) {
      return;
    }

    if (!address || !walletClient || !proxyAddr) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);
    setLoading(true);
    approveMarginToken({
      walletClient,
      settleTokenAddr: selectedPool.settleTokenAddr,
      isMultisigAddress,
      proxyAddr,
      minAmount: addAmount / 1.05 / userPrice,
      decimals: poolTokenDecimals,
      registeredToken: flatToken?.registeredToken,
    })
      .then(() => {
        setApprovalCompleted(false);
        return addLiquidity(walletClient, liqProvTool, selectedPool.poolSymbol, addAmount / userPrice);
      })
      .then((tx) => {
        setTxHash(tx.hash);
        toast.success(<ToastContent title={t('pages.vault.toast.adding')} bodyLines={[]} />);
      })
      .catch((err) => {
        console.error(err);
        let msg = (err?.message ?? err) as string;
        msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
        toast.error(
          <ToastContent
            title={t('pages.vault.toast.error.title')}
            bodyLines={[{ label: t('pages.vault.toast.error.body'), value: msg }]}
          />
        );
        setLoading(false);
      })
      .finally(() => {
        requestSentRef.current = false;
        setRequestSent(false);
      });
  };

  const predictedAmount = useMemo(() => {
    if (addAmount > 0 && dCurrencyPrice != null && selectedPool != null && c2s.has(selectedPool.poolSymbol)) {
      return addAmount / userPrice / (c2s.get(selectedPool.poolSymbol)?.value ?? 1) / dCurrencyPrice;
    }
    return 0;
  }, [addAmount, c2s, selectedPool, dCurrencyPrice, userPrice]);

  const isButtonDisabled = useMemo(() => {
    if (
      !addAmount ||
      loading ||
      requestSent ||
      !isSDKConnected ||
      !selectedPool?.brokerCollateralLotSize ||
      !poolTokenBalance
    ) {
      return true;
    }
    return addAmount > poolTokenBalance * userPrice || addAmount < selectedPool.brokerCollateralLotSize * userPrice;
  }, [addAmount, loading, requestSent, isSDKConnected, selectedPool, poolTokenBalance, userPrice]);

  const validityCheckAddType = useMemo(() => {
    if (!address || !isConnected) {
      return ValidityCheckAddE.NoAddress;
    }
    if (!isEnabledChain(chain?.id)) {
      return ValidityCheckAddE.WrongNetwork;
    }
    if (requestSent || !isSDKConnected || !selectedPool?.brokerCollateralLotSize) {
      return ValidityCheckAddE.Empty;
    }
    if (!poolTokenBalance) {
      return ValidityCheckAddE.NoFunds;
    }
    if (!addAmount) {
      return ValidityCheckAddE.NoAmount;
    }
    const isAmountTooBig = addAmount > poolTokenBalance * userPrice;
    if (isAmountTooBig) {
      return ValidityCheckAddE.AmountTooBig;
    }
    const isAmountBelowMinimum = addAmount < selectedPool.brokerCollateralLotSize * userPrice;
    if (isAmountBelowMinimum) {
      return ValidityCheckAddE.AmountBelowMinimum;
    }
    return ValidityCheckAddE.GoodToGo;
  }, [
    address,
    chain?.id,
    isConnected,
    addAmount,
    requestSent,
    isSDKConnected,
    selectedPool?.brokerCollateralLotSize,
    poolTokenBalance,
    userPrice,
  ]);

  const validityCheckAddText = useMemo(() => {
    if (validityCheckAddType === ValidityCheckAddE.NoAddress) {
      return `${t('pages.vault.add.validity-no-address')}`;
    } else if (validityCheckAddType === ValidityCheckAddE.WrongNetwork) {
      return `${t('error.wrong-network')}`;
    } else if (validityCheckAddType === ValidityCheckAddE.NoFunds) {
      return `${t('pages.vault.add.validity-no-funds')}`;
    } else if (validityCheckAddType === ValidityCheckAddE.Empty) {
      return `${t('pages.vault.add.validity-empty')}`;
    } else if (validityCheckAddType === ValidityCheckAddE.AmountTooBig) {
      return `${t('pages.vault.add.validity-amount-too-big')}`;
    } else if (validityCheckAddType === ValidityCheckAddE.AmountBelowMinimum) {
      return `${t(
        'pages.vault.add.validity-amount-below-min'
      )} (${(selectedPool?.brokerCollateralLotSize ?? 1) * userPrice} ${userSymbol})`;
    } else if (validityCheckAddType === ValidityCheckAddE.NoAmount) {
      return `${t('pages.vault.add.validity-no-amount')}`;
    }
    if (isMultisigAddress && !approvalCompleted) {
      return t('pages.vault.add.approve-button');
    }
    return t('pages.vault.add.button');
  }, [
    t,
    isMultisigAddress,
    validityCheckAddType,
    selectedPool?.brokerCollateralLotSize,
    approvalCompleted,
    userPrice,
    userSymbol,
  ]);

  useEffect(() => {
    if (triggerFocusStateRef.current === triggerAddInputFocus) {
      return;
    }

    triggerFocusStateRef.current = triggerAddInputFocus;

    document.getElementById(ADD_INPUT_FIELD_ID)?.focus();
    setTimeout(() => {
      document.getElementById(ADD_INPUT_FIELD_ID)?.scrollIntoView({ behavior: 'smooth' });
      document.getElementById(ADD_INPUT_FIELD_ID)?.focus();
    }, DELAY_FOR_SCROLL);
  }, [triggerAddInputFocus]);

  const handleButtonClick = () => {
    if (isMultisigAddress && !approvalCompleted) {
      handleApprove();
    } else {
      handleAddLiquidity();
    }
  };

  const shareSymbol = `d${selectedPool?.settleSymbol}`;

  return (
    <div className={styles.root}>
      <div className={styles.infoBlock}>
        <Typography variant="h5" color={'var(--d8x-color-text-main)'}>
          {t('pages.vault.add.title')}
        </Typography>
        <Typography variant="body2" className={styles.text}>
          {t('pages.vault.add.info1', { poolSymbol: userSymbol, shareSymbol })}
        </Typography>
        <Typography variant="body2" className={styles.text}>
          {t('pages.vault.add.info2', { shareSymbol })}
        </Typography>
      </div>
      <div className={styles.contentBlock}>
        <div className={styles.inputLine}>
          <div className={styles.labelHolder}>
            <InfoLabelBlock
              title={t('pages.vault.add.amount.title', { poolSymbol: userSymbol })}
              content={t('pages.vault.add.amount.info1', { poolSymbol: userSymbol })}
            />
          </div>
          <ResponsiveInput
            id={ADD_INPUT_FIELD_ID}
            className={styles.inputHolder}
            inputValue={inputValue}
            setInputValue={handleInputCapture}
            currency={userSymbol}
            step="1"
            min={0}
            max={poolTokenBalance ? Number((poolTokenBalance * 0.9999 * userPrice).toFixed(5)) : 999999}
            disabled={loading}
          />
        </div>
        {poolTokenBalance ? (
          <Typography className={styles.helperText} variant="bodyTiny">
            {t('common.max')}{' '}
            <Link
              onClick={() => {
                if (poolTokenBalance) {
                  handleInputCapture(`${Number((poolTokenBalance * 0.9999 * userPrice).toFixed(5))}`);
                }
              }}
            >
              {formatToCurrency(0.9999 * poolTokenBalance * userPrice, userSymbol)}
            </Link>
          </Typography>
        ) : null}
        <div className={styles.iconSeparator}>
          <SwitchIcon />
        </div>
        <div className={styles.inputLine}>
          <div className={styles.labelHolder}>{t('pages.vault.add.receive', { shareSymbol })}</div>
          <div className={styles.inputHolder}>
            <OutlinedInput
              id="expected-amount"
              endAdornment={
                <InputAdornment position="end" className={styles.expectedAmountInput}>
                  <Typography variant="adornment" color={'var(--d8x-color-text-label-one)'}>
                    d{selectedPool?.settleSymbol}
                  </Typography>
                </InputAdornment>
              }
              type="text"
              value={selectedPool ? formatToCurrency(predictedAmount, '') : '-'}
              disabled
            />
          </div>
        </div>
        <div className={styles.buttonHolder}>
          {validityCheckAddType === ValidityCheckAddE.NoFunds && (
            <Button variant={'buy'} onClick={() => setDepositModalOpen(true)} className={styles.actionButton}>
              {validityCheckAddText}
            </Button>
          )}
          {validityCheckAddType !== ValidityCheckAddE.NoFunds && (
            <GasDepositChecker className={styles.actionButton}>
              <Button
                variant="primary"
                disabled={isButtonDisabled}
                onClick={handleButtonClick}
                className={styles.actionButton}
              >
                {loading && <CircularProgress size="24px" sx={{ mr: 2 }} />}
                {validityCheckAddText}
              </Button>
            </GasDepositChecker>
          )}
        </div>
      </div>
    </div>
  );
});

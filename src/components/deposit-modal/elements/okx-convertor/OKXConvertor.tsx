import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useChainId, useReadContracts, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, CircularProgress, Link, Typography } from '@mui/material';

import { wrapOKB } from 'blockchain-api/contract-interactions/wrapOKB';
import { ToastContent } from 'components/toast-content/ToastContent';
import { CurrencyItemI } from 'components/currency-selector/types';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { OrSeparator } from 'components/separator/OrSeparator';
import { Translate } from 'components/translate/Translate';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { getTxnLink } from 'helpers/getTxnLink';
import { poolsAtom } from 'store/pools.store';
import { triggerUserStatsUpdateAtom } from 'store/vault-pools.store';
import { xlayer } from 'utils/chains';
import { formatToCurrency } from 'utils/formatToCurrency';

import modalStyles from '../../../positions-table/elements/modals/Modal.module.scss';
import styles from '../../DepositModal.module.scss';

const OKX_LAYER_CHAIN_ID = 196;
const OKX_GAS_TOKEN_NAME = xlayer.nativeCurrency.name;
const OKX_WRAPPED_TOKEN_NAME = 'WOKB';
const OKB_WARP_CURRENCIES = [OKX_GAS_TOKEN_NAME, OKX_WRAPPED_TOKEN_NAME];

const currencyConvertMap: Record<string, string> = {
  [OKX_GAS_TOKEN_NAME]: OKX_WRAPPED_TOKEN_NAME,
  [OKX_WRAPPED_TOKEN_NAME]: OKX_GAS_TOKEN_NAME,
};

interface OKXConvertorPropsI {
  selectedCurrency: CurrencyItemI | undefined;
}

interface ActionDataI {
  amount: number;
  isWrap: boolean;
  currency: string;
}

export const OKXConvertor = ({ selectedCurrency }: OKXConvertorPropsI) => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address, chain, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { gasTokenBalance, refetchWallet } = useUserWallet();

  const pools = useAtomValue(poolsAtom);
  const setTriggerUserStatsUpdate = useSetAtom(triggerUserStatsUpdateAtom);

  const [amountValue, setAmountValue] = useState('0');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Address>();
  const [actionData, setActionData] = useState<ActionDataI>();

  const requestSentRef = useRef(false);

  const poolByWrappedToken = useMemo(() => {
    if (pools.length === 0) {
      return null;
    }
    return pools.find(({ poolSymbol }) => poolSymbol === OKX_WRAPPED_TOKEN_NAME) || null;
  }, [pools]);

  const { data: tokenBalanceData, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: poolByWrappedToken?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: poolByWrappedToken?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled:
        address &&
        selectedCurrency?.name === OKX_GAS_TOKEN_NAME &&
        poolByWrappedToken?.marginTokenAddr !== undefined &&
        isConnected,
    },
  });

  const tokenBalance = useMemo(() => {
    if (!selectedCurrency) {
      return 0;
    }
    if (selectedCurrency.name === OKX_WRAPPED_TOKEN_NAME) {
      return gasTokenBalance ? +formatUnits(gasTokenBalance.value, gasTokenBalance.decimals) : 0;
    }
    return tokenBalanceData ? +formatUnits(tokenBalanceData[0], tokenBalanceData[1]) : 0;
  }, [selectedCurrency, gasTokenBalance, tokenBalanceData]);

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
    setTriggerUserStatsUpdate((prevValue) => !prevValue);
    refetch();
    refetchWallet();
    setLoading(false);
  }, [isFetched, txHash, refetch, refetchWallet, setTriggerUserStatsUpdate]);

  useEffect(() => {
    if (!isError || !reason || !txHash) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('common.deposit-modal.convert.toasts.tx-failed.title')}
        bodyLines={[{ label: t('common.deposit-modal.convert.toasts.tx-failed.body'), value: reason.message }]}
      />
    );
    setTxHash(undefined);
    setActionData(undefined);
    setLoading(false);
  }, [isError, txHash, reason, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    toast.success(
      <ToastContent
        title={t(`common.deposit-modal.convert.toasts.success-${actionData?.isWrap ? 'wrap' : 'unwrap'}.title`)}
        bodyLines={[
          {
            label: t(`common.deposit-modal.convert.toasts.success-${actionData?.isWrap ? 'wrap' : 'unwrap'}.body`),
            value: formatToCurrency(actionData?.amount, actionData?.currency),
          },
          {
            label: '',
            value: (
              <a
                href={getTxnLink(chain?.blockExplorers?.default?.url, txHash)}
                target="_blank"
                rel="noreferrer"
                className={modalStyles.shareLink}
              >
                {txHash}
              </a>
            ),
          },
        ]}
      />
    );
    setActionData(undefined);
    setLoading(false);
  }, [isSuccess, actionData, txHash, chain, t]);

  const wrapOKBToken = useCallback(() => {
    if (requestSentRef.current || !walletClient || !poolByWrappedToken || !gasTokenBalance) {
      return;
    }

    requestSentRef.current = true;
    setLoading(true);

    wrapOKB({
      walletClient,
      wrappedTokenAddress: poolByWrappedToken.marginTokenAddr as Address,
      wrappedTokenDecimals: gasTokenBalance.decimals,
      amountWrap: +amountValue,
    })
      .then((hash) => {
        setTxHash(hash);
        setActionData({
          amount: +amountValue,
          isWrap: true,
          currency: OKX_GAS_TOKEN_NAME,
        });
      })
      .catch((error) => {
        toast.error(
          <ToastContent
            title={t('common.deposit-modal.convert.toasts.tx-failed.title')}
            bodyLines={[
              {
                label: t('common.deposit-modal.convert.toasts.tx-failed.body'),
                value: error.shortMessage || error.message,
              },
            ]}
          />
        );
        console.error(error);
        setLoading(false);
      })
      .finally(() => {
        requestSentRef.current = false;
      });
  }, [walletClient, poolByWrappedToken, gasTokenBalance, amountValue, t]);

  const unwrapOKBToken = useCallback(() => {
    if (requestSentRef.current || !walletClient || !poolByWrappedToken || !gasTokenBalance) {
      return;
    }

    requestSentRef.current = true;
    setLoading(true);

    wrapOKB({
      walletClient,
      wrappedTokenAddress: poolByWrappedToken.marginTokenAddr as Address,
      wrappedTokenDecimals: gasTokenBalance.decimals,
      amountUnwrap: +amountValue,
    })
      .then((hash) => {
        setTxHash(hash);
        setActionData({
          amount: +amountValue,
          isWrap: false,
          currency: OKX_WRAPPED_TOKEN_NAME,
        });
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      })
      .finally(() => {
        requestSentRef.current = false;
      });
  }, [walletClient, poolByWrappedToken, gasTokenBalance, amountValue]);

  const handleInputBlur = useCallback(() => {
    if (tokenBalance > 0 && amountValue !== '0' && +amountValue > tokenBalance) {
      setAmountValue(`${tokenBalance}`);
    }
  }, [tokenBalance, amountValue]);

  useEffect(() => {
    setAmountValue('0');
  }, [chainId, selectedCurrency]);

  if (chainId !== OKX_LAYER_CHAIN_ID || !selectedCurrency || !OKB_WARP_CURRENCIES.includes(selectedCurrency.name)) {
    return null;
  }

  return (
    <div className={styles.section}>
      <Typography variant="bodyTiny" className={styles.noteText}>
        <Translate
          i18nKey="common.deposit-modal.convert.text"
          values={{ fromCurrency: selectedCurrency.name, toCurrency: currencyConvertMap[selectedCurrency.name] }}
        />
      </Typography>
      <div className={styles.dataLine}>
        <div>
          <ResponsiveInput
            id="convert-amount"
            className={styles.inputHolder}
            inputClassName={styles.input}
            inputValue={amountValue}
            handleInputBlur={handleInputBlur}
            setInputValue={setAmountValue}
            currency={currencyConvertMap[selectedCurrency.name]}
            min={0}
            max={tokenBalance || 0}
            disabled={loading}
          />
          {tokenBalance ? (
            <Typography className={styles.helperText} variant="bodyTiny">
              {t('common.max')}{' '}
              <Link
                onClick={() => {
                  if (tokenBalance) {
                    setAmountValue(`${tokenBalance}`);
                  }
                }}
              >
                {formatToCurrency(tokenBalance, currencyConvertMap[selectedCurrency.name])}
              </Link>
            </Typography>
          ) : null}
        </div>
        <div>
          <Button
            onClick={selectedCurrency.name === OKX_WRAPPED_TOKEN_NAME ? wrapOKBToken : unwrapOKBToken}
            variant="primary"
            size="small"
            disabled={loading || amountValue === '0'}
          >
            {loading && <CircularProgress size="24px" sx={{ mr: 2 }} />}
            {t('common.deposit-modal.convert.button')}
          </Button>
        </div>
      </div>
      <OrSeparator className={styles.orSeparator} />
    </div>
  );
};

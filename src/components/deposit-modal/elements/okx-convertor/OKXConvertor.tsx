import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useChainId, useReadContracts, useWalletClient } from 'wagmi';

import { Button, CircularProgress, Link, Typography } from '@mui/material';

import { CurrencyItemI } from 'components/currency-selector/types';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { OrSeparator } from 'components/separator/OrSeparator';
import { Translate } from 'components/translate/Translate';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { poolsAtom } from 'store/pools.store';
import { xlayer } from 'utils/chains';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from '../../DepositModal.module.scss';
import { wrapOKB } from 'blockchain-api/contract-interactions/wrapOKB';

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

export const OKXConvertor = ({ selectedCurrency }: OKXConvertorPropsI) => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address, isConnected } = useAccount();

  const pools = useAtomValue(poolsAtom);
  const { data: walletClient } = useWalletClient();

  const [amountValue, setAmountValue] = useState('0');
  const [loading, setLoading] = useState(false);

  const { gasTokenBalance /*, refetchWallet*/ } = useUserWallet();

  const poolByWrappedToken = useMemo(() => {
    if (pools.length === 0) {
      return null;
    }
    return pools.find(({ poolSymbol }) => poolSymbol === OKX_WRAPPED_TOKEN_NAME) || null;
  }, [pools]);

  const { data: tokenBalanceData /*, refetch*/ } = useReadContracts({
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

  const wrapOKBToken = useCallback(() => {
    if (!walletClient || !poolByWrappedToken || !tokenBalanceData) {
      return;
    }
    setLoading(true);

    wrapOKB({
      walletClient,
      wrappedTokenAddress: poolByWrappedToken.marginTokenAddr as Address,
      wrappedTokenDecimals: tokenBalanceData[1],
      amountWrap: +amountValue,
    }).then(() => {
      setLoading(false);
    });
  }, [walletClient, poolByWrappedToken, tokenBalanceData, amountValue]);

  const unwrapOKBToken = useCallback(() => {
    if (!walletClient || !poolByWrappedToken || !tokenBalanceData) {
      return;
    }
    setLoading(true);
    wrapOKB({
      walletClient,
      wrappedTokenAddress: poolByWrappedToken.marginTokenAddr as Address,
      wrappedTokenDecimals: tokenBalanceData[1],
      amountUnwrap: +amountValue,
    }).then(() => {
      setLoading(false);
    });
  }, [walletClient, poolByWrappedToken, tokenBalanceData, amountValue]);

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

import { roundToLotString } from '@d8x/perpetuals-sdk';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type Address } from 'viem';
import { useAccount } from 'wagmi';

import { Typography } from '@mui/material';

import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { InputE } from 'components/responsive-input/enums';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';
import { getMaxOrderSizeForTrader } from 'network/network';
import { defaultCurrencyAtom } from 'store/app.store';
import { orderBlockAtom } from 'store/order-block.store';
import {
  perpetualStaticInfoAtom,
  poolTokenBalanceAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
  triggerBalancesUpdateAtom,
} from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { DefaultCurrencyE, OrderBlockE } from 'types/enums';
import { formatToCurrency, valueToFractionDigits } from 'utils/formatToCurrency';
import { isEnabledChain } from 'utils/isEnabledChain';

import { useMinPositionString } from '../../hooks/useMinPositionString';
import { Slider } from './elements/slider/Slider';
import { TokenSelect } from './elements/token-select/TokenSelect';
import {
  currencyMultiplierAtom,
  inputValueAtom,
  maxTraderOrderSizeAtom,
  orderSizeAtom,
  selectedCurrencyAtom,
  setInputFromOrderSizeAtom,
  setOrderSizeAtom,
} from './store';

import styles from './OrderSize.module.scss';

const roundMaxOrderSize = (value: number) => {
  const numberDigits = valueToFractionDigits(value);
  const multiplier = 10 ** numberDigits;
  return Math.round(value * multiplier) / multiplier;
};

const INTERVAL_FOR_DATA_REFETCH = 1000;
const MAX_ORDER_SIZE_RETRIES = 120;

export const OrderSize = memo(() => {
  const { t } = useTranslation();

  const { address, chainId } = useAccount();

  const [orderSize, setOrderSizeDirect] = useAtom(orderSizeAtom);
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [selectedCurrency, setSelectedCurrency] = useAtom(selectedCurrencyAtom);
  const [maxOrderSize, setMaxOrderSize] = useAtom(maxTraderOrderSizeAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const poolTokenBalance = useAtomValue(poolTokenBalanceAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const orderBlock = useAtomValue(orderBlockAtom);
  const isSDKConnected = useAtomValue(sdkConnectedAtom);
  const defaultCurrency = useAtomValue(defaultCurrencyAtom);
  const currencyMultiplier = useAtomValue(currencyMultiplierAtom);
  const triggerBalancesUpdate = useAtomValue(triggerBalancesUpdateAtom);
  const setInputFromOrderSize = useSetAtom(setInputFromOrderSizeAtom);
  const setOrderSize = useSetAtom(setOrderSizeAtom);

  const fetchedMaxSizesRef = useRef(false);
  const maxOrderSizeDefinedRef = useRef(false);
  const maxOrderSizeRetriesCountRef = useRef(0);
  const maxOrderSizeRequestRef = useRef(false);
  const triggerBalancesUpdateRef = useRef(triggerBalancesUpdate);
  const perpetualIdRef = useRef(selectedPerpetual?.id);

  const { minPositionString } = useMinPositionString(currencyMultiplier, perpetualStaticInfo);

  const maxOrderSizeCurrent = useMemo(() => {
    if (maxOrderSize !== undefined) {
      return maxOrderSize * currencyMultiplier;
    }
  }, [maxOrderSize, currencyMultiplier]);

  const onInputChange = useCallback(
    (value: string) => {
      if (value) {
        let max;
        if (maxOrderSizeCurrent === undefined || maxOrderSizeCurrent === null) {
          max = Number(value) / currencyMultiplier;
        } else {
          max =
            Number(value) / currencyMultiplier > maxOrderSizeCurrent
              ? maxOrderSizeCurrent
              : Number(value) / currencyMultiplier;
        }
        setOrderSize(max);
        setInputValue(value);
      } else {
        setOrderSizeDirect(0);
        setInputValue('');
      }
    },
    [setOrderSizeDirect, setOrderSize, setInputValue, currencyMultiplier, maxOrderSizeCurrent]
  );

  useEffect(() => {
    if (!selectedPerpetual || !selectedPool) {
      return;
    }
    if (defaultCurrency === DefaultCurrencyE.Base) {
      setSelectedCurrency(selectedPerpetual.baseCurrency);
    } else if (defaultCurrency === DefaultCurrencyE.Quote) {
      setSelectedCurrency(selectedPerpetual.quoteCurrency);
    } else {
      setSelectedCurrency(selectedPool.settleSymbol);
    }
  }, [selectedPerpetual, selectedPool, defaultCurrency, setSelectedCurrency]);

  const handleInputBlur = useCallback(() => {
    setInputFromOrderSize(orderSize);
  }, [orderSize, setInputFromOrderSize]);

  const orderSizeStep = useMemo(() => {
    if (perpetualStaticInfo) {
      if (currencyMultiplier === 1) {
        return roundToLotString(perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC);
      } else {
        const roundedValueBase =
          Number(roundToLotString(perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC)) * currencyMultiplier;
        const numberDigits = valueToFractionDigits(roundedValueBase);
        return roundedValueBase.toFixed(numberDigits);
      }
    }
    return '0.1';
  }, [perpetualStaticInfo, currencyMultiplier]);

  const fetchMaxOrderSize = useCallback(
    async (_chainId: number, _address: string, _lotSizeBC: number, _perpId: number, _isLong: boolean) => {
      if (!traderAPI || fetchedMaxSizesRef.current || selectedPerpetual?.state !== 'NORMAL') {
        return;
      }

      const symbol = traderAPI.getSymbolFromPerpId(_perpId);
      if (!symbol) {
        return;
      }
      fetchedMaxSizesRef.current = true;
      const data = await getMaxOrderSizeForTrader(_chainId, traderAPI, _address, symbol).catch((err) => {
        console.error(err);
      });
      fetchedMaxSizesRef.current = false;
      if (!data?.data) {
        return;
      }

      let maxAmount: number | undefined;
      if (_isLong) {
        maxAmount = data.data.buy;
      } else {
        maxAmount = data.data.sell;
      }
      return maxAmount < _lotSizeBC ? 0 : +roundToLotString(maxAmount, _lotSizeBC);
    },
    [traderAPI, selectedPerpetual]
  );

  const refetchMaxOrderSize = useCallback(
    (userAddress: Address, needValueCleanUp: boolean) => {
      if (maxOrderSizeRequestRef.current && maxOrderSize !== 0 && maxOrderSize !== undefined) {
        return;
      }

      if (!perpetualStaticInfo || !isSDKConnected || !isEnabledChain(chainId)) {
        if (needValueCleanUp) {
          setMaxOrderSize(undefined);
          maxOrderSizeDefinedRef.current = false;
        }
        return;
      }

      maxOrderSizeRequestRef.current = true;
      perpetualIdRef.current = perpetualStaticInfo.id;

      fetchMaxOrderSize(
        chainId,
        userAddress,
        perpetualStaticInfo.lotSizeBC,
        perpetualStaticInfo.id,
        orderBlock === OrderBlockE.Long
      )
        .then((result) => {
          if (perpetualIdRef.current === perpetualStaticInfo.id) {
            setMaxOrderSize(result !== undefined && !isNaN(result) ? result * 0.995 : 10_000);
            maxOrderSizeDefinedRef.current = result !== undefined && !isNaN(result) && result !== 0; // also refetch if we get a 0, to be sure
          }
        })
        .catch((error) => {
          console.error(error);
          maxOrderSizeDefinedRef.current = false;
        })
        .finally(() => {
          maxOrderSizeRequestRef.current = false;
        });
    },
    [isSDKConnected, chainId, perpetualStaticInfo, orderBlock, fetchMaxOrderSize, setMaxOrderSize, maxOrderSize]
  );

  useEffect(() => {
    if (!address) {
      setMaxOrderSize(undefined);
      return;
    }

    fetchedMaxSizesRef.current = false; // Reset on address change or chainId change

    let needValueCleanUp = true;
    if (triggerBalancesUpdateRef.current !== triggerBalancesUpdate) {
      needValueCleanUp = false;
      triggerBalancesUpdateRef.current = triggerBalancesUpdate;
    }

    maxOrderSizeDefinedRef.current = false;
    refetchMaxOrderSize(address, needValueCleanUp);

    const intervalId = setInterval(() => {
      if (maxOrderSizeDefinedRef.current) {
        maxOrderSizeRetriesCountRef.current = 0;
        clearInterval(intervalId);
        return;
      }

      if (MAX_ORDER_SIZE_RETRIES <= maxOrderSizeRetriesCountRef.current) {
        clearInterval(intervalId);
        console.warn(`Max order size fetch failed after ${MAX_ORDER_SIZE_RETRIES}.`);
        maxOrderSizeRetriesCountRef.current = 0;
        return;
      }

      refetchMaxOrderSize(address, needValueCleanUp);
      maxOrderSizeRetriesCountRef.current++;
    }, INTERVAL_FOR_DATA_REFETCH);

    return () => {
      clearInterval(intervalId);
      maxOrderSizeRetriesCountRef.current = 0;
      maxOrderSizeRequestRef.current = false;
    };
  }, [refetchMaxOrderSize, address, triggerBalancesUpdate, setMaxOrderSize, chainId]);

  const settleSymbol = useMemo(() => {
    if (!selectedPool || !selectedPerpetual) {
      return '';
    }

    if (
      !selectedPool?.settleSymbol ||
      selectedPool.settleSymbol === selectedPerpetual.quoteCurrency ||
      selectedPool.settleSymbol === selectedPerpetual.baseCurrency
    ) {
      return '';
    }

    return selectedPool.settleSymbol;
  }, [selectedPool, selectedPerpetual]);

  return (
    <div className={styles.root}>
      <div className={styles.manualBlock}>
        <div className={styles.labelHolder}>
          <div className={styles.walletBalance}>
            <Typography variant="bodySmallPopup" className={styles.infoText}>
              {t('pages.trade.order-block.info.balance')}:
            </Typography>
            <TooltipMobile tooltip={selectedPool?.settleTokenAddr ? selectedPool.settleTokenAddr.toString() : '...'}>
              <Typography variant="bodySmallSB" className={styles.infoTextTooltip}>
                {formatToCurrency(poolTokenBalance, selectedPool?.settleSymbol)}
              </Typography>
            </TooltipMobile>
          </div>
          <InfoLabelBlock
            title={t('pages.trade.order-block.order-size.title')}
            content={
              <>
                <Typography> {t('pages.trade.order-block.order-size.body1')} </Typography>
                <Typography>
                  {t('pages.trade.order-block.order-size.body2')}{' '}
                  {formatToCurrency(maxOrderSizeCurrent, selectedCurrency)}.{' '}
                  {t('pages.trade.order-block.order-size.body3')} {minPositionString} {selectedCurrency}.{' '}
                  {t('pages.trade.order-block.order-size.body4')}{' '}
                  {formatToCurrency(+orderSizeStep, selectedCurrency, false, valueToFractionDigits(+orderSizeStep))}.
                </Typography>
              </>
            }
          />
        </div>
        <TokenSelect />
      </div>
      <div className={styles.inputBlock}>
        <ResponsiveInput
          id="order-size"
          inputValue={inputValue}
          setInputValue={onInputChange}
          handleInputBlur={handleInputBlur}
          currency={
            <DynamicLogo
              logoName={selectedCurrency.toLowerCase()}
              className={styles.dynamicLogo}
              width={24}
              height={24}
            />
          }
          step={orderSizeStep}
          min={0}
          max={maxOrderSizeCurrent !== undefined ? roundMaxOrderSize(maxOrderSizeCurrent) : undefined}
          className={styles.inputHolder}
          type={InputE.Outlined}
        />
        <div className={styles.actionIconsHolder}>
          {selectedPerpetual && selectedCurrency !== selectedPerpetual.quoteCurrency && (
            <DynamicLogo
              logoName={selectedPerpetual?.quoteCurrency.toLowerCase() ?? ''}
              width={24}
              height={24}
              className={styles.currencyIcon}
              onClick={() => setSelectedCurrency(selectedPerpetual.quoteCurrency)}
            />
          )}
          {selectedPerpetual && selectedCurrency !== selectedPerpetual.baseCurrency && (
            <DynamicLogo
              logoName={selectedPerpetual?.baseCurrency.toLowerCase() ?? ''}
              width={24}
              height={24}
              className={styles.currencyIcon}
              onClick={() => setSelectedCurrency(selectedPerpetual.baseCurrency)}
            />
          )}
          {selectedPool && selectedCurrency !== selectedPool.settleSymbol && (
            <DynamicLogo
              logoName={settleSymbol.toLowerCase()}
              width={24}
              height={24}
              className={styles.currencyIcon}
              onClick={() => setSelectedCurrency(selectedPool.settleSymbol)}
            />
          )}
        </div>
      </div>
      <Slider />
    </div>
  );
});

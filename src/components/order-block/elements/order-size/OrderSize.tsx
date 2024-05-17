import { roundToLotString } from '@d8x/perpetuals-sdk';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Address } from 'viem';
import { useAccount } from 'wagmi';

import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { ClickAwayListener, Grow, IconButton, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { getMaxOrderSizeForTrader } from 'network/network';
import { defaultCurrencyAtom } from 'store/app.store';
import { orderBlockAtom } from 'store/order-block.store';
import {
  perpetualStaticInfoAtom,
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
import { OrderSizeSlider } from './components/OrderSizeSlider';
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

  const [openCurrencySelector, setOpenCurrencySelector] = useState(false);

  const fetchedMaxSizes = useRef(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const maxOrderSizeDefinedRef = useRef(false);
  const maxOrderSizeRetriesCountRef = useRef(0);

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
      setSelectedCurrency(selectedPool.poolSymbol);
    }
  }, [selectedPerpetual, selectedPool, defaultCurrency, setSelectedCurrency]);

  const handleInputBlur = useCallback(() => {
    setInputFromOrderSize(orderSize);
  }, [orderSize, setInputFromOrderSize]);

  const currencyOptions = useMemo(() => {
    if (!selectedPool || !selectedPerpetual) {
      return [];
    }

    const currencies = [selectedPerpetual.baseCurrency, selectedPerpetual.quoteCurrency];
    if (!currencies.includes(selectedPool.poolSymbol)) {
      currencies.push(selectedPool.poolSymbol);
    }
    return currencies;
  }, [selectedPool, selectedPerpetual]);

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
      if (!traderAPI || fetchedMaxSizes.current) {
        return;
      }

      const symbol = traderAPI.getSymbolFromPerpId(_perpId);
      if (!symbol) {
        return;
      }

      fetchedMaxSizes.current = true;
      const data = await getMaxOrderSizeForTrader(_chainId, traderAPI, _address, symbol).catch((err) => {
        console.error(err);
      });
      fetchedMaxSizes.current = false;
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
    [traderAPI]
  );

  const refetchMaxOrderSize = useCallback(
    (userAddress: Address) => {
      if (!perpetualStaticInfo || !isSDKConnected || !chainId || !isEnabledChain(chainId)) {
        return;
      }

      fetchMaxOrderSize(
        chainId,
        userAddress,
        perpetualStaticInfo.lotSizeBC,
        perpetualStaticInfo.id,
        orderBlock === OrderBlockE.Long
      )
        .then((result) => {
          setMaxOrderSize(result !== undefined && !isNaN(result) ? result * 0.995 : 10_000);
          maxOrderSizeDefinedRef.current = result !== undefined && !isNaN(result);
        })
        .catch((error) => {
          console.error(error);
          maxOrderSizeDefinedRef.current = false;
        });
    },
    [isSDKConnected, chainId, perpetualStaticInfo, orderBlock, fetchMaxOrderSize, setMaxOrderSize]
  );

  useEffect(() => {
    if (!address) {
      return;
    }

    maxOrderSizeDefinedRef.current = false;
    refetchMaxOrderSize(address);

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

      refetchMaxOrderSize(address);
      maxOrderSizeRetriesCountRef.current++;
    }, INTERVAL_FOR_DATA_REFETCH);

    return () => {
      clearInterval(intervalId);
      maxOrderSizeRetriesCountRef.current = 0;
    };
  }, [refetchMaxOrderSize, address, triggerBalancesUpdate]);

  const handleCurrencyChangeToggle = () => {
    setOpenCurrencySelector((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (anchorRef.current?.contains(event.target as HTMLElement)) {
      return;
    }

    setOpenCurrencySelector(false);
  };

  const handleCurrencySelect = (
    _event: MouseEvent<HTMLAnchorElement> | MouseEvent<HTMLLIElement>,
    currency: string
  ) => {
    setSelectedCurrency(currency);
    setOpenCurrencySelector(false);
  };

  return (
    <>
      <div className={styles.root}>
        <div className={styles.labelHolder}>
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
                  {formatToCurrency(+orderSizeStep, selectedCurrency, false, 4)}.
                </Typography>
              </>
            }
          />
        </div>
        <ResponsiveInput
          id="order-size"
          inputValue={inputValue}
          setInputValue={onInputChange}
          handleInputBlur={handleInputBlur}
          currency={
            <span onClick={handleCurrencyChangeToggle} className={styles.currencyLabel}>
              {selectedCurrency}
            </span>
          }
          step={orderSizeStep}
          min={0}
          max={maxOrderSizeCurrent !== undefined ? roundMaxOrderSize(maxOrderSizeCurrent) : undefined}
          className={styles.inputHolder}
          adornmentAction={
            <div ref={anchorRef}>
              <IconButton
                aria-label="change currency"
                onClick={handleCurrencyChangeToggle}
                edge="start"
                size="small"
                className={styles.selector}
              >
                {openCurrencySelector ? <ArrowDropUp /> : <ArrowDropDown />}
              </IconButton>
              <Popper
                sx={{
                  zIndex: 1,
                }}
                open={openCurrencySelector}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
              >
                {({ TransitionProps, placement }) => (
                  <Grow
                    {...TransitionProps}
                    style={{
                      transformOrigin: placement === 'bottom' ? 'left top' : 'left bottom',
                    }}
                  >
                    <Paper>
                      <ClickAwayListener onClickAway={handleClose}>
                        <MenuList id="split-button-menu" autoFocusItem className={styles.menuItems}>
                          {currencyOptions.map((option) => (
                            <MenuItem
                              key={option}
                              selected={option === selectedCurrency}
                              onClick={(event) => handleCurrencySelect(event, option)}
                            >
                              {option}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>
            </div>
          }
        />
      </div>
      <OrderSizeSlider />
    </>
  );
});

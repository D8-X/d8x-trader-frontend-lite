import { roundToLotString } from '@d8x/perpetuals-sdk';
import { useAtom, useSetAtom } from 'jotai';
import { memo, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Box, ClickAwayListener, Grow, IconButton, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { getMaxOrderSizeForTrader } from 'network/network';
import { defaultCurrencyAtom } from 'store/app.store';
import { orderBlockAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, selectedPerpetualAtom, selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { DefaultCurrencyE, OrderBlockE } from 'types/enums';
import { formatToCurrency, valueToFractionDigits } from 'utils/formatToCurrency';

import { useMinPositionString } from '../../hooks/useMinPositionString';
import { OrderSizeSlider } from './components/OrderSizeSlider';
import styles from './OrderSize.module.scss';
import {
  currencyMultiplierAtom,
  inputValueAtom,
  maxTraderOrderSizeAtom,
  orderSizeAtom,
  selectedCurrencyAtom,
  setInputFromOrderSizeAtom,
  setOrderSizeAtom,
} from './store';

const roundMaxOrderSize = (value: number) => {
  const numberDigits = valueToFractionDigits(value);
  const multiplier = 10 ** numberDigits;
  return Math.round(value * multiplier) / multiplier;
};

export const OrderSize = memo(() => {
  const { t } = useTranslation();

  const [orderSize, setOrderSizeDirect] = useAtom(orderSizeAtom);
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [perpetualStaticInfo] = useAtom(perpetualStaticInfoAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [orderBlock] = useAtom(orderBlockAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [defaultCurrency] = useAtom(defaultCurrencyAtom);
  const [selectedCurrency, setSelectedCurrency] = useAtom(selectedCurrencyAtom);
  const [currencyMultiplier] = useAtom(currencyMultiplierAtom);
  const setInputFromOrderSize = useSetAtom(setInputFromOrderSizeAtom);
  const setOrderSize = useSetAtom(setOrderSizeAtom);
  const [maxOrderSize, setMaxOrderSize] = useAtom(maxTraderOrderSizeAtom);

  const [openCurrencySelector, setOpenCurrencySelector] = useState(false);

  const { address } = useAccount();
  const chainId = useChainId();

  const fetchedMaxSizes = useRef(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const { minPositionString } = useMinPositionString(currencyMultiplier, perpetualStaticInfo);

  const onInputChange = useCallback(
    (value: string) => {
      if (value) {
        setOrderSize(Number(value) / currencyMultiplier);
        setInputValue(value);
      } else {
        setOrderSizeDirect(0);
        setInputValue('');
      }
    },
    [setOrderSizeDirect, setOrderSize, setInputValue, currencyMultiplier]
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
      if (traderAPI && !fetchedMaxSizes.current) {
        const symbol = traderAPI.getSymbolFromPerpId(_perpId);
        if (!symbol) {
          return;
        }
        fetchedMaxSizes.current = true;
        const data = await getMaxOrderSizeForTrader(_chainId, traderAPI, _address, symbol).catch((err) => {
          console.error(err);
        });
        fetchedMaxSizes.current = false;
        let maxAmount: number | undefined;
        if (_isLong) {
          maxAmount = data?.data?.buy;
        } else {
          maxAmount = data?.data?.sell;
        }
        return maxAmount === undefined ? undefined : +roundToLotString(maxAmount, _lotSizeBC);
      }
    },
    [traderAPI]
  );

  useEffect(() => {
    if (perpetualStaticInfo && address && isSDKConnected) {
      fetchMaxOrderSize(
        chainId,
        address,
        perpetualStaticInfo.lotSizeBC,
        perpetualStaticInfo.id,
        orderBlock === OrderBlockE.Long
      ).then((result) => {
        if (result) {
          setMaxOrderSize(result * 0.995);
        }
      });
    }
  }, [isSDKConnected, chainId, address, perpetualStaticInfo, orderBlock, fetchMaxOrderSize, setMaxOrderSize]);

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

  const maxOrderSizeCurrent = maxOrderSize && maxOrderSize * currencyMultiplier;
  return (
    <>
      <Box className={styles.root}>
        <Box className={styles.labelHolder}>
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
        </Box>
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
          max={maxOrderSizeCurrent && roundMaxOrderSize(maxOrderSizeCurrent)}
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
      </Box>
      <OrderSizeSlider />
    </>
  );
});

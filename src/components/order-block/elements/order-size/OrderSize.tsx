import { roundToLotString } from '@d8x/perpetuals-sdk';
import { useAtom, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, ClickAwayListener, Grow, IconButton, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { getMaxOrderSizeForTrader } from 'network/network';
import { defaultCurrencyAtom } from 'store/app.store';
import { orderBlockAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, selectedPerpetualAtom, selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { DefaultCurrencyE, OrderBlockE } from 'types/enums';
import { formatToCurrency, valueToFractionDigits } from 'utils/formatToCurrency';

import commonStyles from '../../OrderBlock.module.scss';
import { OrderSizeSlider } from './components/OrderSizeSlider';
import styles from './OrderSize.module.scss';
import {
  currentMultiplierAtom,
  inputValueAtom,
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
  const [currentMultiplier] = useAtom(currentMultiplierAtom);
  const setInputFromOrderSize = useSetAtom(setInputFromOrderSizeAtom);
  const setOrderSize = useSetAtom(setOrderSizeAtom);

  const [openCurrencySelector, setOpenCurrencySelector] = useState(false);
  const [maxOrderSizeInBase, setMaxOrderSizeInBase] = useState<number | undefined>(undefined);
  const [maxOrderSize, setMaxOrderSize] = useState<number | undefined>(undefined);

  const { address } = useAccount();
  const chainId = useChainId();

  const fetchedMaxSizes = useRef(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const onInputChange = useCallback(
    (value: string) => {
      if (value) {
        setOrderSize(Number(value));
        setInputValue(value);
      } else {
        setOrderSizeDirect(0);
        setInputValue('0');
      }
    },
    [setOrderSizeDirect, setOrderSize, setInputValue]
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
      const numberDigits = valueToFractionDigits(
        +roundToLotString(perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC) * currentMultiplier
      );
      if (currentMultiplier === 1) {
        return roundToLotString(perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC);
      } else {
        return (
          +roundToLotString(perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC) * currentMultiplier
        ).toFixed(numberDigits);
      }
    }
    return '0.1';
  }, [perpetualStaticInfo, currentMultiplier]);

  const minPositionString = useMemo(() => {
    if (perpetualStaticInfo) {
      return formatToCurrency(
        +roundToLotString(10 * perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC) * currentMultiplier,
        '',
        false,
        undefined,
        true
      );
    }
    return '0.1';
  }, [perpetualStaticInfo, currentMultiplier]);

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
        setMaxOrderSizeInBase(result);
      });
    }
  }, [isSDKConnected, chainId, address, perpetualStaticInfo, orderBlock, fetchMaxOrderSize]);

  useEffect(() => {
    if (maxOrderSizeInBase) {
      setMaxOrderSize(maxOrderSizeInBase * currentMultiplier);
    }
  }, [maxOrderSizeInBase, currentMultiplier]);

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
      <Box className={styles.root}>
        <Box className={styles.label}>
          <InfoBlock
            title={t('pages.trade.order-block.order-size.title')}
            content={
              <>
                <Typography> {t('pages.trade.order-block.order-size.body1')} </Typography>
                <Typography>
                  {t('pages.trade.order-block.order-size.body2')} {formatToCurrency(maxOrderSize, selectedCurrency)}.{' '}
                  {t('pages.trade.order-block.order-size.body3')} {minPositionString} {selectedCurrency}.{' '}
                  {t('pages.trade.order-block.order-size.body4')}{' '}
                  {formatToCurrency(+orderSizeStep, selectedCurrency, false, 4)}.
                </Typography>
              </>
            }
            classname={commonStyles.actionIcon}
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
          max={maxOrderSize && roundMaxOrderSize(maxOrderSize)}
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
                <ArrowDropDownIcon />
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

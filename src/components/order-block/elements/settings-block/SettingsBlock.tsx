import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';

import { OrderSettings } from '../order-settings/OrderSettings';
import { ReduceOnlySelector } from '../reduce-only-selector/ReduceOnlySelector';
import { DefaultCurrencySelect } from './components/default-currency/DefaultCurrencySelect';
import { OrderBlockSelect } from './components/order-block/OrderBlockSelect';

import { createSymbol } from 'helpers/createSymbol';
import { OrderBlockE, OrderSideE, OrderTypeE } from 'types/enums';
import { orderInfoAtom, orderTypeAtom, reduceOnlyAtom } from 'store/order-block.store';
import { perpetualStatisticsAtom, positionsAtom } from 'store/pools.store';

import styles from './SettingsBlock.module.scss';

export const SettingsBlock = memo(() => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isBigScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const positions = useAtomValue(positionsAtom);
  const orderType = useAtomValue(orderTypeAtom);
  const perpetualStatistics = useAtomValue(perpetualStatisticsAtom);
  const orderInfo = useAtomValue(orderInfoAtom);
  // const [keepPositionLeverage, setKeepPositionLeverage] = useAtom(keepPositionLeverageAtom);
  const setReduceOnly = useSetAtom(reduceOnlyAtom);

  // const isKeepPosLeverageDisabled = useMemo(() => {
  //   if (perpetualStatistics) {
  //     const symbol = createSymbol({
  //       baseCurrency: perpetualStatistics.baseCurrency,
  //       quoteCurrency: perpetualStatistics.quoteCurrency,
  //       poolSymbol: perpetualStatistics.poolName,
  //     });
  //
  //     return !positions.find((position) => position.symbol === symbol);
  //   }
  //   return true;
  // }, [perpetualStatistics, positions]);

  const isReduceOnlyEnabled = useMemo(() => {
    if (perpetualStatistics && orderInfo) {
      const symbol = createSymbol({
        baseCurrency: perpetualStatistics.baseCurrency,
        quoteCurrency: perpetualStatistics.quoteCurrency,
        poolSymbol: perpetualStatistics.poolName,
      });

      const side = orderInfo.orderBlock === OrderBlockE.Long ? OrderSideE.Buy : OrderSideE.Sell;

      return !!positions.find((position) => position.symbol === symbol && position.side != side);
    }
    return false;
  }, [perpetualStatistics, positions, orderInfo]);

  useEffect(() => {
    if (!isReduceOnlyEnabled) {
      setReduceOnly(false);
    }
  }, [isReduceOnlyEnabled, setReduceOnly]);

  return (
    <Box className={styles.root}>
      <OrderSettings />

      {orderType !== OrderTypeE.Market && isReduceOnlyEnabled && (
        <div className={styles.optionRow}>
          <Typography variant="bodyMedium" className={styles.setting}>
            {t('pages.trade.order-block.reduce-only')}
          </Typography>
          <ReduceOnlySelector />
        </div>
      )}

      {/*
      <div className={styles.keepPosLeverage}>
        <FormControlLabel
          id="keep-position-leverage"
          value="true"
          defaultChecked={keepPositionLeverage}
          disabled={isKeepPosLeverageDisabled}
          onChange={(_event, checked) => setKeepPositionLeverage(checked)}
          control={keepPositionLeverage ? <Checkbox checked={true} /> : <Checkbox checked={false} />}
          label="Keep pos. leverage"
          labelPlacement="end"
        />
      </div>
      */}

      {isBigScreen && (
        <Box className={styles.optionRow}>
          <Typography variant="bodyMedium" className={styles.setting}>
            {t('common.settings.ui-settings.order-block.title')}
          </Typography>
          <OrderBlockSelect />
        </Box>
      )}

      <Box className={styles.optionRow}>
        <Typography variant="bodyMedium" className={styles.setting}>
          {t('common.settings.ui-settings.default-currency.title')}
        </Typography>
        <DefaultCurrencySelect />
      </Box>
    </Box>
  );
});

import classNames from 'classnames';
import { useAtom } from 'jotai';
import { ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { orderInfoAtom, stopLossAtom, stopLossPriceAtom } from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { OrderBlockE, StopLossE } from 'types/enums';
import { mapCurrencyToFractionDigits } from 'utils/formatToCurrency';

import commonStyles from '../../OrderBlock.module.scss';
import styles from './StopLossSelector.module.scss';

export const StopLossSelector = memo(() => {
  const [orderInfo] = useAtom(orderInfoAtom);
  const [stopLoss, setStopLoss] = useAtom(stopLossAtom);
  const [, setStopLossPrice] = useAtom(stopLossPriceAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);

  const [stopLossInputPrice, setStopLossInputPrice] = useState<number | null>(null);

  const currentOrderBlockRef = useRef(orderInfo?.orderBlock);
  const currentLeverageRef = useRef(orderInfo?.leverage);

  const handleStopLossPriceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const stopLossPriceValue = event.target.value;
      if (stopLossPriceValue !== '') {
        setStopLossInputPrice(+stopLossPriceValue);
        setStopLoss(null);
      } else {
        setStopLossInputPrice(null);
      }
    },
    [setStopLoss]
  );

  const handleStopLossChange = useCallback(
    (stopLossValue: StopLossE) => {
      setStopLossPrice(null);
      setStopLossInputPrice(null);
      setStopLoss(stopLossValue);
    },
    [setStopLossPrice, setStopLoss]
  );

  const minStopLossPrice = useMemo(() => {
    if (orderInfo?.midPrice && orderInfo.orderBlock === OrderBlockE.Short) {
      return orderInfo.midPrice;
    } else if (orderInfo?.midPrice && orderInfo?.leverage) {
      return orderInfo.midPrice - orderInfo.midPrice / orderInfo.leverage;
    }
    return 0;
  }, [orderInfo?.midPrice, orderInfo?.orderBlock, orderInfo?.leverage]);

  const maxStopLossPrice = useMemo(() => {
    if (orderInfo?.midPrice && orderInfo.orderBlock === OrderBlockE.Long) {
      return orderInfo.midPrice;
    } else if (orderInfo?.midPrice && orderInfo?.leverage) {
      return orderInfo.midPrice + orderInfo.midPrice / orderInfo.leverage;
    }
  }, [orderInfo?.midPrice, orderInfo?.orderBlock, orderInfo?.leverage]);

  const fractionDigits = useMemo(() => {
    if (selectedPerpetual?.quoteCurrency) {
      const foundFractionDigits = mapCurrencyToFractionDigits[selectedPerpetual.quoteCurrency];
      return foundFractionDigits !== undefined ? foundFractionDigits : 2;
    }
    return 2;
  }, [selectedPerpetual?.quoteCurrency]);

  const validateStopLossPrice = useCallback(() => {
    if (stopLossInputPrice === null) {
      setStopLossPrice(null);
      setStopLoss(StopLossE.None);
      return;
    }

    if (maxStopLossPrice && stopLossInputPrice > maxStopLossPrice) {
      const maxStopLossPriceRounded = +maxStopLossPrice.toFixed(fractionDigits);
      setStopLossPrice(maxStopLossPriceRounded);
      setStopLossInputPrice(maxStopLossPriceRounded);
      return;
    }
    if (stopLossInputPrice < minStopLossPrice) {
      const minStopLossPriceRounded = +minStopLossPrice.toFixed(fractionDigits);
      setStopLossPrice(minStopLossPriceRounded);
      setStopLossInputPrice(minStopLossPriceRounded);
      return;
    }

    setStopLossPrice(stopLossInputPrice);
  }, [minStopLossPrice, maxStopLossPrice, stopLossInputPrice, setStopLoss, setStopLossPrice, fractionDigits]);

  useEffect(() => {
    if (currentOrderBlockRef.current !== orderInfo?.orderBlock) {
      currentOrderBlockRef.current = orderInfo?.orderBlock;

      setStopLossPrice(null);
      setStopLossInputPrice(null);

      if (orderInfo?.stopLoss === null) {
        setStopLoss(StopLossE.None);
      }
    }
  }, [orderInfo?.orderBlock, orderInfo?.stopLoss, setStopLossPrice, setStopLoss]);

  useEffect(() => {
    if (currentLeverageRef.current !== orderInfo?.leverage) {
      currentLeverageRef.current = orderInfo?.leverage;

      validateStopLossPrice();
    }
  }, [orderInfo?.leverage, validateStopLossPrice]);

  useEffect(() => {
    if (stopLoss && stopLoss !== StopLossE.None && orderInfo?.stopLossPrice) {
      setStopLossInputPrice(+orderInfo.stopLossPrice.toFixed(fractionDigits));
    }
  }, [stopLoss, orderInfo?.stopLossPrice, fractionDigits]);

  return (
    <Box className={styles.root}>
      <Box className={styles.labelHolder}>
        <Box className={styles.label}>
          <InfoBlock
            title="Stop loss"
            content={
              <>
                <Typography>You can specify a stop loss order to go along with your main order.</Typography>
                <Typography>
                  If you select e.g. -50%, you create a second order, that will be triggered if your loss on your main
                  order reaches -50%.
                </Typography>
                <Typography>
                  Technically, you are specifying a stop-market order, of the opposing side (if your main order is a BUY
                  order, you are specifying a stop-market SELL order). The trigger price is automatically calculated
                  such that your overall loss is as per your selection, assuming you entered at the worst price your
                  slippage settings allow.
                </Typography>
              </>
            }
            classname={commonStyles.actionIcon}
          />
        </Box>
        <OutlinedInput
          id="custom-stop-loss-price"
          className={styles.customPriceInput}
          endAdornment={
            <InputAdornment position="end">
              <Typography variant="adornment">{selectedPerpetual?.quoteCurrency}</Typography>
            </InputAdornment>
          }
          type="number"
          value={stopLossInputPrice || ''}
          placeholder="-"
          onChange={handleStopLossPriceChange}
          onBlur={validateStopLossPrice}
          inputProps={{ step: 0.01 }}
        />
      </Box>
      <Box className={styles.stopLossOptions}>
        {Object.values(StopLossE).map((key) => (
          <Button
            key={key}
            variant="outlined"
            className={classNames({ [styles.selected]: key === stopLoss })}
            onClick={() => handleStopLossChange(key)}
          >
            {key}
          </Button>
        ))}
      </Box>
    </Box>
  );
});

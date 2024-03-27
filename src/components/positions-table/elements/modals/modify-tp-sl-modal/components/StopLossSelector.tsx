import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { CustomPriceSelector } from 'components/custom-price-selector/CustomPriceSelector';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { parseSymbol } from 'helpers/parseSymbol';
import { OrderSideE, OrderValueTypeE, StopLossE } from 'types/enums';
import { MarginAccountWithAdditionalDataI } from 'types/types';
import { valueToFractionDigits } from 'utils/formatToCurrency';
import { mapStopLossToNumber } from 'utils/mapStopLossToNumber';

interface StopLossSelectorPropsI {
  setStopLossPrice: Dispatch<SetStateAction<number | null | undefined>>;
  position: MarginAccountWithAdditionalDataI;
}

export const StopLossSelector = memo(({ setStopLossPrice, position }: StopLossSelectorPropsI) => {
  const { t } = useTranslation();

  const [stopLoss, setStopLoss] = useState<StopLossE | null>(null);
  const [stopLossInputPrice, setStopLossInputPrice] = useState<number | null | undefined>(undefined);

  const parsedSymbol = parseSymbol(position.symbol);

  const handleStopLossPriceChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const stopLossPriceValue = event.target.value;
    if (stopLossPriceValue !== '') {
      setStopLossInputPrice(+stopLossPriceValue);
    } else {
      setStopLossInputPrice(undefined);
    }
    setStopLoss(null);
  };

  const handleStopLossChange = (stopLossValue: StopLossE) => {
    setStopLossPrice(null);
    setStopLossInputPrice(null);
    setStopLoss(stopLossValue);
  };

  const minStopLossPrice = useMemo(() => {
    if (position.entryPrice && position.side === OrderSideE.Sell) {
      return position.entryPrice;
    } else if (position.leverage) {
      return Math.max(0.000000001, position.entryPrice - position.entryPrice / position.leverage);
    }
    return 0.000000001;
  }, [position]);

  const maxStopLossPrice = useMemo(() => {
    if (position.entryPrice && position.side === OrderSideE.Buy) {
      return position.entryPrice;
    } else if (position.leverage) {
      return position.entryPrice + position.entryPrice / position.leverage;
    }
  }, [position]);

  const stepSize = useMemo(() => calculateStepSize(position.entryPrice), [position.entryPrice]);

  const validateStopLossPrice = useCallback(() => {
    if (stopLossInputPrice === null) {
      setStopLossPrice(stopLossInputPrice);
      return;
    }

    if (stopLossInputPrice === undefined) {
      setStopLossPrice(position.stopLoss.fullValue);
      setStopLossInputPrice(position.stopLoss.fullValue);
      return;
    }

    if (maxStopLossPrice && stopLossInputPrice > maxStopLossPrice) {
      const maxStopLossPriceRounded = +maxStopLossPrice;
      setStopLossPrice(maxStopLossPriceRounded);
      setStopLossInputPrice(maxStopLossPriceRounded);
      return;
    }
    if (stopLossInputPrice < minStopLossPrice) {
      const minStopLossPriceRounded = +minStopLossPrice;
      setStopLossPrice(minStopLossPriceRounded);
      setStopLossInputPrice(minStopLossPriceRounded);
      return;
    }

    setStopLossPrice(stopLossInputPrice);
  }, [minStopLossPrice, maxStopLossPrice, stopLossInputPrice, setStopLossPrice, position.stopLoss.fullValue]);

  useEffect(() => {
    if (stopLoss && stopLoss !== StopLossE.None) {
      let stopPrice;
      if (position.side === OrderSideE.Buy) {
        stopPrice = position.entryPrice * (1 - Math.abs(mapStopLossToNumber(stopLoss) / position.leverage));
      } else {
        stopPrice = position.entryPrice * (1 + Math.abs(mapStopLossToNumber(stopLoss) / position.leverage));
      }
      setStopLossInputPrice(Math.max(0.000000001, +stopPrice.toFixed(valueToFractionDigits(+stopPrice))));
    }
  }, [stopLoss, position]);

  useEffect(() => {
    setStopLossPrice(stopLossInputPrice);
  }, [stopLossInputPrice, setStopLossPrice]);

  useEffect(() => {
    if (position.stopLoss.valueType === OrderValueTypeE.Full && position.stopLoss.fullValue) {
      setStopLossInputPrice(position.stopLoss.fullValue);
    }
  }, [position.stopLoss.valueType, position.stopLoss.fullValue]);

  const translationMap: Record<StopLossE, string> = {
    [StopLossE.None]: t('pages.trade.order-block.stop-loss.none'),
    [StopLossE['1%']]: '1%',
    [StopLossE['25%']]: '25%',
    [StopLossE['50%']]: '50%',
    [StopLossE['75%']]: '75%',
  };

  return (
    <CustomPriceSelector<StopLossE>
      id="custom-stop-loss-price"
      label={
        <InfoLabelBlock
          title={t('pages.trade.order-block.stop-loss.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.stop-loss.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.stop-loss.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.stop-loss.body3')}</Typography>
            </>
          }
        />
      }
      options={Object.values(StopLossE)}
      translationMap={translationMap}
      handlePriceChange={handleStopLossChange}
      handleInputPriceChange={handleStopLossPriceChange}
      validateInputPrice={validateStopLossPrice}
      selectedInputPrice={stopLoss !== StopLossE.None ? stopLossInputPrice : null}
      selectedPrice={stopLoss}
      currency={parsedSymbol?.quoteCurrency}
      stepSize={stepSize}
    />
  );
});

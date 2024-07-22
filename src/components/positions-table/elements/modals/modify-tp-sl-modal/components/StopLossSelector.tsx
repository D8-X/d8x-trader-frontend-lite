import { useAtomValue } from 'jotai';
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
import { calculateProbability } from 'helpers/calculateProbability';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { parseSymbol } from 'helpers/parseSymbol';
import { OrderSideE, OrderValueTypeE, StopLossE } from 'types/enums';
import { MarginAccountWithAdditionalDataI } from 'types/types';
import { valueToFractionDigits } from 'utils/formatToCurrency';
import { mapStopLossToNumber } from 'utils/mapStopLossToNumber';
import { traderAPIAtom } from 'store/pools.store';

interface StopLossSelectorPropsI {
  setStopLossPrice: Dispatch<SetStateAction<number | null | undefined>>;
  position: MarginAccountWithAdditionalDataI;
  disabled?: boolean;
}

export const StopLossSelector = memo(({ setStopLossPrice, position, disabled }: StopLossSelectorPropsI) => {
  const { t } = useTranslation();

  const traderAPI = useAtomValue(traderAPIAtom);

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

  const [entryPrice, liqPrice, isPredictionMarket] = useMemo(() => {
    if (!!traderAPI && !!position) {
      try {
        return traderAPI?.isPredictionMarket(position.symbol)
          ? [
              calculateProbability(position.entryPrice, position.side === OrderSideE.Sell),
              calculateProbability(position.liqPrice, position.side === OrderSideE.Sell),
              true,
            ]
          : [position.entryPrice, position.liqPrice, false];
      } catch (error) {
        // skip
      }
    }
    return [position.entryPrice, position.liqPrice];
  }, [position, traderAPI]);

  const minStopLossPrice = useMemo(() => {
    if (entryPrice && position.side === OrderSideE.Sell) {
      return isPredictionMarket ? Math.max(0.000000001, liqPrice) : entryPrice;
    } else if (position.side === OrderSideE.Buy) {
      return Math.max(0.000000001, liqPrice);
    }
    return 0.000000001;
  }, [position, entryPrice, liqPrice, isPredictionMarket]);

  const maxStopLossPrice = useMemo(() => {
    if (entryPrice && position.side === OrderSideE.Buy) {
      return entryPrice;
    } else if (position.side === OrderSideE.Sell) {
      return isPredictionMarket ? entryPrice : liqPrice;
    }
  }, [position, entryPrice, liqPrice, isPredictionMarket]);

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
      if (position.side === OrderSideE.Buy || (position.side === OrderSideE.Sell && isPredictionMarket)) {
        stopPrice = Math.max(liqPrice, entryPrice * (1 - Math.abs(mapStopLossToNumber(stopLoss) / position.leverage)));
      } else {
        stopPrice = Math.min(liqPrice, entryPrice * (1 + Math.abs(mapStopLossToNumber(stopLoss) / position.leverage)));
      }
      setStopLossInputPrice(Math.max(0.000000001, +stopPrice.toFixed(valueToFractionDigits(+stopPrice))));
    }
  }, [stopLoss, position, entryPrice, liqPrice, isPredictionMarket]);

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
      disabled={disabled}
    />
  );
});

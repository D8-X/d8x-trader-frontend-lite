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
import { OrderSideE, OrderValueTypeE, TakeProfitE } from 'types/enums';
import { MarginAccountWithAdditionalDataI } from 'types/types';
import { valueToFractionDigits } from 'utils/formatToCurrency';
import { mapTakeProfitToNumber } from 'utils/mapTakeProfitToNumber';
import { traderAPIAtom } from 'store/pools.store';

interface TakeProfitSelectorPropsI {
  setTakeProfitPrice: Dispatch<SetStateAction<number | null | undefined>>;
  position: MarginAccountWithAdditionalDataI;
  disabled?: boolean;
}

export const TakeProfitSelector = memo(({ setTakeProfitPrice, position, disabled }: TakeProfitSelectorPropsI) => {
  const { t } = useTranslation();

  const traderAPI = useAtomValue(traderAPIAtom);

  const [takeProfit, setTakeProfit] = useState<TakeProfitE | null>(null);
  const [takeProfitInputPrice, setTakeProfitInputPrice] = useState<number | null | undefined>(undefined);

  const parsedSymbol = parseSymbol(position.symbol);

  const handleTakeProfitPriceChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const takeProfitPriceValue = event.target.value;
    if (takeProfitPriceValue !== '') {
      setTakeProfitInputPrice(+takeProfitPriceValue);
    } else {
      setTakeProfitInputPrice(undefined);
    }
    setTakeProfit(null);
  };

  const handleTakeProfitChange = (takeProfitValue: TakeProfitE) => {
    setTakeProfitPrice(null);
    setTakeProfitInputPrice(null);
    setTakeProfit(takeProfitValue);
  };

  const [entryPrice, isPredictionMarket] = useMemo(() => {
    if (!!traderAPI && !!position) {
      try {
        const predMarket = traderAPI?.isPredictionMarket(position.symbol);

        return [
          predMarket
            ? calculateProbability(position.entryPrice, position.side === OrderSideE.Sell)
            : position.entryPrice,
          predMarket,
        ];
      } catch (error) {
        // skip
      }
    }
    return [position.entryPrice, false];
  }, [position, traderAPI]);

  const minTakeProfitPrice = useMemo(() => {
    if (entryPrice && position.side === OrderSideE.Buy) {
      return entryPrice;
    } else if (entryPrice) {
      return isPredictionMarket ? entryPrice : 0.000000001;
    }
    return 0.000000001;
  }, [position, entryPrice, isPredictionMarket]);

  const maxTakeProfitPrice = useMemo(() => {
    if (entryPrice && position.side === OrderSideE.Sell) {
      return isPredictionMarket ? undefined : entryPrice;
    }
    return undefined;
  }, [position, entryPrice, isPredictionMarket]);

  const stepSize = useMemo(() => calculateStepSize(position.entryPrice), [position.entryPrice]);

  const validateTakeProfitPrice = useCallback(() => {
    if (takeProfitInputPrice === null) {
      setTakeProfitPrice(takeProfitInputPrice);
      return;
    }

    if (takeProfitInputPrice === undefined) {
      setTakeProfitPrice(position.takeProfit.fullValue);
      setTakeProfitInputPrice(position.takeProfit.fullValue);
      return;
    }

    if (maxTakeProfitPrice && takeProfitInputPrice > maxTakeProfitPrice) {
      const maxTakeProfitPriceRounded = +maxTakeProfitPrice;
      setTakeProfitPrice(maxTakeProfitPriceRounded);
      setTakeProfitInputPrice(maxTakeProfitPriceRounded);
      return;
    }
    if (takeProfitInputPrice < minTakeProfitPrice) {
      const minTakeProfitPriceRounded = +minTakeProfitPrice;
      setTakeProfitPrice(minTakeProfitPriceRounded);
      setTakeProfitInputPrice(minTakeProfitPriceRounded);
      return;
    }

    setTakeProfitPrice(takeProfitInputPrice);
  }, [minTakeProfitPrice, maxTakeProfitPrice, takeProfitInputPrice, setTakeProfitPrice, position.takeProfit.fullValue]);

  useEffect(() => {
    if (takeProfit && takeProfit !== TakeProfitE.None) {
      let limitPrice;
      if (position.side === OrderSideE.Buy || (position.side === OrderSideE.Sell && isPredictionMarket)) {
        limitPrice = entryPrice * (1 + mapTakeProfitToNumber(takeProfit) / position.leverage);
      } else {
        limitPrice = entryPrice * (1 - mapTakeProfitToNumber(takeProfit) / position.leverage);
      }
      setTakeProfitInputPrice(Math.max(0.000000001, +limitPrice.toFixed(valueToFractionDigits(+limitPrice))));
    }
  }, [takeProfit, position, entryPrice, isPredictionMarket]);

  useEffect(() => {
    setTakeProfitPrice(takeProfitInputPrice);
  }, [takeProfitInputPrice, setTakeProfitPrice]);

  useEffect(() => {
    if (position.takeProfit.valueType === OrderValueTypeE.Full && position.takeProfit.fullValue) {
      setTakeProfitInputPrice(position.takeProfit.fullValue);
    }
  }, [position.takeProfit.valueType, position.takeProfit.fullValue]);

  const translationMap: Record<TakeProfitE, string> = {
    [TakeProfitE.None]: t('pages.trade.order-block.take-profit.none'),
    [TakeProfitE['1%']]: '1%',
    [TakeProfitE['50%']]: '50%',
    [TakeProfitE['100%']]: '100%',
    [TakeProfitE['500%']]: '500%',
  };

  return (
    <CustomPriceSelector<TakeProfitE>
      id="custom-take-profit-price"
      label={
        <InfoLabelBlock
          title={t('pages.trade.order-block.take-profit.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.take-profit.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.take-profit.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.take-profit.body3')}</Typography>
            </>
          }
        />
      }
      options={Object.values(TakeProfitE)}
      translationMap={translationMap}
      handlePriceChange={handleTakeProfitChange}
      handleInputPriceChange={handleTakeProfitPriceChange}
      validateInputPrice={validateTakeProfitPrice}
      selectedInputPrice={takeProfit !== TakeProfitE.None ? takeProfitInputPrice : null}
      selectedPrice={takeProfit}
      currency={parsedSymbol?.quoteCurrency}
      stepSize={stepSize}
      disabled={disabled}
    />
  );
});

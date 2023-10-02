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
import { InfoBlock } from 'components/info-block/InfoBlock';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { parseSymbol } from 'helpers/parseSymbol';
import { OrderSideE, OrderValueTypeE, TakeProfitE } from 'types/enums';
import { MarginAccountWithAdditionalDataI } from 'types/types';
import { getFractionDigits } from 'utils/formatToCurrency';
import { mapTakeProfitToNumber } from 'utils/mapTakeProfitToNumber';

import styles from './CommonSelector.module.scss';

interface TakeProfitSelectorPropsI {
  setTakeProfitPrice: Dispatch<SetStateAction<number | null | undefined>>;
  position: MarginAccountWithAdditionalDataI;
}

export const TakeProfitSelector = memo(({ setTakeProfitPrice, position }: TakeProfitSelectorPropsI) => {
  const { t } = useTranslation();

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

  const minTakeProfitPrice = useMemo(() => {
    if (position.entryPrice && position.side === OrderSideE.Buy) {
      return position.entryPrice;
    }
    return 0;
  }, [position]);

  const maxTakeProfitPrice = useMemo(() => {
    if (position.entryPrice && position.side === OrderSideE.Sell) {
      return position.entryPrice;
    }
    return undefined;
  }, [position]);

  const fractionDigits = useMemo(() => getFractionDigits(parsedSymbol?.quoteCurrency), [parsedSymbol?.quoteCurrency]);

  const stepSize = useMemo(() => calculateStepSize(position.entryPrice), [position.entryPrice]);

  const validateTakeProfitPrice = useCallback(() => {
    if (takeProfitInputPrice == null) {
      setTakeProfitPrice(takeProfitInputPrice);
      return;
    }

    if (maxTakeProfitPrice && takeProfitInputPrice > maxTakeProfitPrice) {
      const maxTakeProfitPriceRounded = +maxTakeProfitPrice.toFixed(fractionDigits);
      setTakeProfitPrice(maxTakeProfitPriceRounded);
      setTakeProfitInputPrice(maxTakeProfitPriceRounded);
      return;
    }
    if (takeProfitInputPrice < minTakeProfitPrice) {
      const minTakeProfitPriceRounded = +minTakeProfitPrice.toFixed(fractionDigits);
      setTakeProfitPrice(minTakeProfitPriceRounded);
      setTakeProfitInputPrice(minTakeProfitPriceRounded);
      return;
    }

    setTakeProfitPrice(takeProfitInputPrice);
  }, [minTakeProfitPrice, maxTakeProfitPrice, takeProfitInputPrice, setTakeProfitPrice, fractionDigits]);

  useEffect(() => {
    if (takeProfit && takeProfit !== TakeProfitE.None) {
      let limitPrice;
      if (position.side === OrderSideE.Buy) {
        limitPrice = position.entryPrice * (1 + mapTakeProfitToNumber(takeProfit) / position.leverage);
      } else {
        limitPrice = position.entryPrice * (1 - mapTakeProfitToNumber(takeProfit) / position.leverage);
      }
      setTakeProfitInputPrice(Math.max(0, +limitPrice.toFixed(fractionDigits)));
    }
  }, [takeProfit, position, fractionDigits]);

  useEffect(() => {
    setTakeProfitPrice(takeProfitInputPrice);
  }, [takeProfitInputPrice, setTakeProfitPrice]);

  useEffect(() => {
    if (position.takeProfit.valueType === OrderValueTypeE.Full && position.takeProfit.fullValue) {
      setTakeProfitInputPrice(position.takeProfit.fullValue);
    }
  }, [position]);

  const translationMap: Record<TakeProfitE, string> = {
    [TakeProfitE.None]: t('pages.trade.order-block.take-profit.none'),
    [TakeProfitE['25%']]: '35%',
    [TakeProfitE['50%']]: '50%',
    [TakeProfitE['100%']]: '100%',
    [TakeProfitE['500%']]: '500%',
  };

  return (
    <CustomPriceSelector<TakeProfitE>
      id="custom-take-profit-price"
      label={
        <InfoBlock
          title={t('pages.trade.order-block.take-profit.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.take-profit.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.take-profit.body2')}</Typography>
              <Typography>{t('pages.trade.order-block.take-profit.body3')}</Typography>
            </>
          }
          classname={styles.actionIcon}
        />
      }
      options={Object.values(TakeProfitE)}
      translationMap={translationMap}
      handlePriceChange={handleTakeProfitChange}
      handleInputPriceChange={handleTakeProfitPriceChange}
      validateInputPrice={validateTakeProfitPrice}
      selectedInputPrice={takeProfitInputPrice}
      selectedPrice={takeProfit}
      currency={parsedSymbol?.quoteCurrency}
      stepSize={stepSize}
    />
  );
});

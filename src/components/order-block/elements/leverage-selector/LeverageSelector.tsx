import { pmInitialMarginRate } from '@d8x/perpetuals-sdk';
import classnames from 'classnames';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { orderBlockAtom, orderInfoAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, perpetualStatisticsAtom } from 'store/pools.store';
import { OrderBlockE } from 'types/enums';
import type { MarkI } from 'types/types';

import { inputValueAtom, leverageAtom, setLeverageAtom } from './store';

import styles from './LeverageSelector.module.scss';

const markCount = 5;

export const LeverageSelector = memo(() => {
  const { t } = useTranslation();

  const leverage = useAtomValue(leverageAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const perpetualStatistics = useAtomValue(perpetualStatisticsAtom);
  const inputValue = useAtomValue(inputValueAtom);
  const orderBlock = useAtomValue(orderBlockAtom);
  const orderInfo = useAtomValue(orderInfoAtom);
  const setLeverage = useSetAtom(setLeverageAtom);

  const maxLeverage = useMemo(() => {
    if (
      orderInfo?.isPredictionMarket !== undefined &&
      perpetualStaticInfo?.initialMarginRate &&
      perpetualStatistics?.markPrice
    ) {
      const initialMarginRate = orderInfo.isPredictionMarket
        ? pmInitialMarginRate(
            orderBlock === OrderBlockE.Long ? 1 : -1,
            perpetualStatistics.markPrice * (1 + 0.01), // 1 percent price impact buffer
            perpetualStatistics.markPrice,
            perpetualStaticInfo.initialMarginRate
          )
        : perpetualStaticInfo.initialMarginRate;

      return Math.floor(1 / initialMarginRate / 0.5) * 0.5;
    }
    return 10;
  }, [
    orderInfo?.isPredictionMarket,
    orderBlock,
    perpetualStaticInfo?.initialMarginRate,
    perpetualStatistics?.markPrice,
  ]);

  const marks = useMemo(() => {
    const newMarks: MarkI[] = [];

    if (maxLeverage <= 5) {
      const step = (maxLeverage - 1) / (markCount - 1);
      for (let i = 0; i < markCount; i++) {
        const value = 1 + i * step;
        newMarks.push({
          value: parseFloat(value.toFixed(2)),
        });
      }
    } else {
      const step = maxLeverage / markCount;
      for (let i = 1; i <= markCount; i++) {
        const value = Math.floor(i * step);
        newMarks.push({
          value: value,
        });
      }
    }

    return newMarks;
  }, [maxLeverage]);

  const handleLeverageInputChange = useCallback(
    (value: string) => {
      setLeverage(Number(value));
    },
    [setLeverage]
  );

  const handleInputBlur = useCallback(() => {
    setLeverage(leverage);
  }, [setLeverage, leverage]);

  const leverageStep = (maxLeverage / 2) % 10 ? 0.5 : 1;

  return (
    <div className={styles.root}>
      <div className={styles.rowOne}>
        <InfoLabelBlock
          title={t('pages.trade.order-block.leverage.title')}
          content={
            <>
              <Typography>{t('pages.trade.order-block.leverage.body1')}</Typography>
              <Typography>{t('pages.trade.order-block.leverage.body2')}</Typography>
            </>
          }
        />
      </div>
      <div className={styles.rowTwo}>
        <div className={styles.buttonsHolder}>
          {marks.map((mark) => (
            <Button
              key={mark.value}
              variant="secondary"
              className={classnames({ [styles.selected]: mark.value === leverage })}
              size="small"
              onClick={() => setLeverage(mark.value)}
            >
              {mark.value}x
            </Button>
          ))}
        </div>
        <ResponsiveInput
          id="leverage"
          className={styles.inputHolder}
          inputClassName={styles.input}
          inputValue={inputValue}
          setInputValue={handleLeverageInputChange}
          handleInputBlur={handleInputBlur}
          currency="X"
          step={`${leverageStep}`}
          min={0}
          max={maxLeverage}
        />
      </div>
    </div>
  );
});

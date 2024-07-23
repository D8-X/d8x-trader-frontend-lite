import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Slider, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { OrderSettings } from 'components/order-block/elements/order-settings/OrderSettings';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { perpetualStaticInfoAtom } from 'store/pools.store';
import { type MarkI } from 'types/types';

import { inputValueAtom, leverageAtom, setLeverageAtom } from './store';

import styles from './LeverageSelector.module.scss';

const multipliers = [0.25, 0.5, 0.75, 1];

function valueLabelFormat(value: number) {
  return `${value}x`;
}

export const LeverageSelector = memo(() => {
  const { t } = useTranslation();

  const leverage = useAtomValue(leverageAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const inputValue = useAtomValue(inputValueAtom);
  const setLeverage = useSetAtom(setLeverageAtom);

  const maxLeverage = useMemo(() => {
    if (perpetualStaticInfo?.initialMarginRate) {
      return Math.round(1 / perpetualStaticInfo.initialMarginRate);
    }
    return 10;
  }, [perpetualStaticInfo?.initialMarginRate]);

  const marks = useMemo(() => {
    const newMarks: MarkI[] = [
      {
        value: 1,
        // label: '1x'
      },
    ];
    multipliers.forEach((multiplier) =>
      newMarks.push({
        value: multiplier * maxLeverage,
        // label: `${multiplier * maxLeverage}x`
      })
    );
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
        <OrderSettings />
      </div>
      <div className={styles.rowTwo}>
        <div className={styles.sliderHolder}>
          <Slider
            aria-label="Leverage values"
            value={leverage}
            min={1}
            max={maxLeverage}
            step={leverageStep}
            getAriaValueText={valueLabelFormat}
            valueLabelFormat={valueLabelFormat}
            valueLabelDisplay="auto"
            marks={marks}
            onChange={(_event, newValue) => {
              if (typeof newValue === 'number') {
                setLeverage(newValue);
              }
            }}
          />
        </div>
        <ResponsiveInput
          id="leverage"
          className={styles.inputHolder}
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

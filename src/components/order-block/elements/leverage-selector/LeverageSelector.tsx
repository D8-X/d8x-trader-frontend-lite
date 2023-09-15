import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Slider, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { OrderSettings } from 'components/order-block/elements/order-settings/OrderSettings';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { leverageAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom } from 'store/pools.store';
import { type MarkI } from 'types/types';

import commonStyles from '../../OrderBlock.module.scss';
import styles from './LeverageSelector.module.scss';

const multipliers = [0.25, 0.5, 0.75, 1];

function valueLabelFormat(value: number) {
  return `${value}x`;
}

export const LeverageSelector = memo(() => {
  const { t } = useTranslation();

  const [leverage, setLeverage] = useAtom(leverageAtom);
  const [perpetualStaticInfo] = useAtom(perpetualStaticInfoAtom);

  const [updatedLeverage, setUpdatedLeverage] = useState(leverage);
  const [inputValue, setInputValue] = useState(`${leverage}`);

  const inputValueChangedRef = useRef(false);

  const maxLeverage = useMemo(() => {
    if (perpetualStaticInfo) {
      const newLeverage = Math.round(1 / perpetualStaticInfo.initialMarginRate);
      if (newLeverage < leverage) {
        setLeverage(newLeverage);
      }
      return newLeverage;
    }
    return 10;
  }, [perpetualStaticInfo, leverage, setLeverage]);

  const marks = useMemo(() => {
    const newMarks: MarkI[] = [{ value: 1, label: '1x' }];
    multipliers.forEach((multiplier) =>
      newMarks.push({ value: multiplier * maxLeverage, label: `${multiplier * maxLeverage}x` })
    );
    return newMarks;
  }, [maxLeverage]);

  const handleLeverageInputChange = useCallback(
    (targetValue: string) => {
      if (targetValue) {
        const numberValue = +targetValue;
        setLeverage(numberValue < 1 ? 1 : numberValue);
        setInputValue(numberValue < 1 ? '1' : `${numberValue}`);
      } else {
        setLeverage(1);
        setInputValue('');
      }
    },
    [setLeverage]
  );

  const handleInputBlur = useCallback(() => {
    setInputValue(`${leverage}`);
  }, [leverage]);

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setLeverage(updatedLeverage);
      setInputValue(`${updatedLeverage}`);
    }
    inputValueChangedRef.current = false;
  }, [setLeverage, updatedLeverage]);

  const leverageStep = useMemo(() => ((maxLeverage / 2) % 10 ? 0.5 : 1), [maxLeverage]);

  return (
    <Box className={styles.root}>
      <Box className={styles.rowOne}>
        <Box className={styles.label}>
          <InfoBlock
            title={t('pages.trade.order-block.leverage.title')}
            content={
              <>
                <Typography>{t('pages.trade.order-block.leverage.body1')}</Typography>
                <Typography>{t('pages.trade.order-block.leverage.body2')}</Typography>
              </>
            }
            classname={commonStyles.actionIcon}
          />
        </Box>
        <OrderSettings />
      </Box>
      <Box className={styles.rowTwo}>
        <Box className={styles.sliderHolder}>
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
                setUpdatedLeverage(newValue);
              }
            }}
          />
        </Box>
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
      </Box>
    </Box>
  );
});

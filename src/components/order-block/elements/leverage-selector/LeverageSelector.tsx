import { useAtom } from 'jotai';
import { memo, useCallback, useMemo } from 'react';

import { Box, Slider, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { OrderSettings } from 'components/order-block/elements/order-settings/OrderSettings';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { leverageAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom } from 'store/pools.store';
import { MarkI } from 'types/types';

import styles from './LeverageSelector.module.scss';

const multipliers = [0.25, 0.5, 0.75, 1];

function valueLabelFormat(value: number) {
  return `${value}x`;
}

export const LeverageSelector = memo(() => {
  const [leverage, setLeverage] = useAtom(leverageAtom);
  const [perpetualStaticInfo] = useAtom(perpetualStaticInfoAtom);

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

  const handleLeverageChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      if (typeof newValue === 'number') {
        setLeverage(newValue);
      }
    },
    [setLeverage]
  );

  const handleLeverageInputChange = useCallback(
    (targetValue: string) => {
      setLeverage(+targetValue);
    },
    [setLeverage]
  );

  const leverageStep = useMemo(() => ((maxLeverage / 2) % 10 ? 0.5 : 1), [maxLeverage]);

  return (
    <Box className={styles.root}>
      <Box className={styles.rowOne}>
        <Box className={styles.label}>
          <InfoBlock
            title="Leverage"
            content={
              <>
                <Typography>Specifies the leverage of your order.</Typography>
                <Typography>
                  If your order is reducing an existing position ("partial closure"), the leverage you select has no
                  impact.
                </Typography>
              </>
            }
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
            onChange={handleLeverageChange}
          />
        </Box>
        <ResponsiveInput
          id="leverage"
          className={styles.inputHolder}
          inputValue={leverage}
          setInputValue={handleLeverageInputChange}
          currency="X"
          step={`${leverageStep}`}
          min={1}
          max={maxLeverage}
        />
      </Box>
    </Box>
  );
});

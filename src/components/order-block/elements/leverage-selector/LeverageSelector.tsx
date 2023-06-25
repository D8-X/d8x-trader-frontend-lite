import { useAtom } from 'jotai';
import type { ChangeEvent } from 'react';
import { memo, useCallback, useMemo } from 'react';

import { Box, Button, InputAdornment, OutlinedInput, Slider, Typography } from '@mui/material';

import { ReactComponent as DecreaseIcon } from 'assets/icons/decreaseIcon.svg';
import { ReactComponent as IncreaseIcon } from 'assets/icons/increaseIcon.svg';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { leverageAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom } from 'store/pools.store';
import { MarkI } from 'types/types';
import { OrderSettings } from 'components/order-block/elements/order-settings/OrderSettings';

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

  const leverageStep = useMemo(() => ((maxLeverage / 2) % 10 ? 0.5 : 1), [maxLeverage]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setLeverage(+event.target.value);
    },
    [setLeverage]
  );

  const handleDecreaseLeverage = useCallback(() => {
    setLeverage(Math.max(1, leverage - leverageStep));
  }, [setLeverage, leverageStep, leverage]);

  const handleIncreaseLeverage = useCallback(() => {
    setLeverage(Math.min(maxLeverage, leverage + leverageStep));
  }, [setLeverage, leverageStep, leverage, maxLeverage]);

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
        <Box className={styles.inputHolder}>
          <Button
            key="decrease-leverage"
            variant="outlined"
            size="small"
            className={styles.decreaseButton}
            onClick={handleDecreaseLeverage}
            disabled={leverage === 1}
          >
            <DecreaseIcon />
          </Button>
          <OutlinedInput
            id="leverage"
            type="number"
            inputProps={{ min: 1, max: maxLeverage }}
            endAdornment={
              <InputAdornment position="end">
                <Typography variant="adornment">X</Typography>
              </InputAdornment>
            }
            onChange={handleInputChange}
            value={leverage}
          />
          <Button
            key="increase-leverage"
            variant="outlined"
            size="small"
            className={styles.increaseButton}
            onClick={handleIncreaseLeverage}
            disabled={leverage >= maxLeverage}
          >
            <IncreaseIcon />
          </Button>
        </Box>
      </Box>
    </Box>
  );
});

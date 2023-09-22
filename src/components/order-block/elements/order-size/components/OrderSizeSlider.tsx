import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { Slider } from '@mui/material';

import styles from '../OrderSize.module.scss';
import { maxOrderSizeAtom, orderSizeSliderAtom, setInputFromOrderSizeAtom, setOrderSizeAtom } from '../store';

const multipliers = [0, 0.25, 0.5, 0.75, 1];
const marks = multipliers.map((multiplier) => ({ value: multiplier * 100, label: `${multiplier * 100}%` }));

const valueLabelFormat = (value: number) => `${Math.round(value)}%`;

export const OrderSizeSlider = () => {
  const [sliderPercent, setSizeFromSlider] = useAtom(orderSizeSliderAtom);
  const [maxOrderSize] = useAtom(maxOrderSizeAtom);
  const setOrderSize = useSetAtom(setOrderSizeAtom);
  const setInputFromOrderSize = useSetAtom(setInputFromOrderSizeAtom);

  // TODO: Remove crutch
  useEffect(() => {
    if (maxOrderSize) {
      const percent = sliderPercent > 100 ? 100 : sliderPercent;
      const roundedValueBase = setOrderSize((percent * maxOrderSize) / 100);
      setInputFromOrderSize(roundedValueBase);
    }
    // eslint-disable-next-line
  }, [maxOrderSize]);

  return (
    <div className={styles.sliderHolder}>
      <Slider
        aria-label="Order size values"
        value={sliderPercent}
        min={0}
        max={100}
        step={1}
        getAriaValueText={valueLabelFormat}
        valueLabelFormat={valueLabelFormat}
        valueLabelDisplay="auto"
        marks={marks}
        onChange={(_event, newValue) => {
          if (typeof newValue === 'number') {
            setSizeFromSlider(newValue);
          }
        }}
      />
    </div>
  );
};

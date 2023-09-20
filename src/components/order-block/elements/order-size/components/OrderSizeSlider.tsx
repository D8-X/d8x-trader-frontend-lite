import { useAtom } from 'jotai';

import { Slider } from '@mui/material';

import styles from '../OrderSize.module.scss';
import { setSizeFromSliderAtom } from '../store';

const multipliers = [0, 0.25, 0.5, 0.75, 1];
const marks = multipliers.map((multiplier) => ({ value: multiplier * 100, label: `${multiplier * 100}%` }));

const valueLabelFormat = (value: number) => `${Math.round(value)}%`;

export const OrderSizeSlider = () => {
  const [sliderPercent, setSizeFromSlider] = useAtom(setSizeFromSliderAtom);

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

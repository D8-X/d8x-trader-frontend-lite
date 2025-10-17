import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';

import { Slider as MuiSlider } from '@mui/material';

import {
  maxOrderSizeAtom,
  orderSizeAtom,
  orderSizeSliderAtom,
  setInputFromOrderSizeAtom,
  setOrderSizeAtom,
} from '../../store';
import { perpetualStaticInfoAtom, positionsAtom, selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';

import styles from './Slider.module.scss';

const multipliers = [0, 0.25, 0.5, 0.75, 1];
const marks = multipliers.map((multiplier) => ({
  value: multiplier * 100,
  label: `${multiplier * 100}%`,
}));

const valueLabelFormat = (value: number) => `${Math.round(value)}%`;

export const Slider = () => {
  const [sliderPercent, setSizeFromSlider] = useAtom(orderSizeSliderAtom);
  const maxOrderSize = useAtomValue(maxOrderSizeAtom);
  const orderSize = useAtomValue(orderSizeAtom);
  const setOrderSize = useSetAtom(setOrderSizeAtom);
  const setInputFromOrderSize = useSetAtom(setInputFromOrderSizeAtom);
  const positions = useAtomValue(positionsAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);

  const hasOpenPosition = useMemo(() => {
    if (!selectedPerpetual || !selectedPool) return false;
    const sym = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`;
    const pos = positions.find((p) => p.symbol === sym);
    return !!pos && pos.positionNotionalBaseCCY !== 0;
  }, [positions, selectedPerpetual, selectedPool]);

  useEffect(() => {
    if (maxOrderSize && maxOrderSize < orderSize) {
      const percent = sliderPercent > 100 ? 100 : sliderPercent;
      const roundedValueBase = setOrderSize((percent * maxOrderSize) / 100);
      setInputFromOrderSize(roundedValueBase);
    }
  }, [maxOrderSize, orderSize, sliderPercent, setOrderSize, setInputFromOrderSize]);

  return (
    <div className={styles.root}>
      <MuiSlider
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
            const clamped = Math.max(0, Math.min(100, newValue));
            // If no open position, enforce that any positive percent is at least the percent for min position size
            if (!hasOpenPosition && maxOrderSize && perpetualStaticInfo) {
              const minPosBase = 10 * perpetualStaticInfo.lotSizeBC; // base units
              const minPercent = Math.min(100, Math.max(1, Math.ceil((minPosBase / maxOrderSize) * 100)));
              if (clamped > 0 && clamped < minPercent) {
                setSizeFromSlider(minPercent);
                return;
              }
            }
            setSizeFromSlider(clamped);
          }
        }}
      />
    </div>
  );
};

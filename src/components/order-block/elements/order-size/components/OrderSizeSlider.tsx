import { atom, useAtom } from 'jotai';
import { useMemo } from 'react';

import { Slider } from '@mui/material';

import { leverageAtom, orderBlockAtom, orderSizeAtom } from 'store/order-block.store';
import { poolTokenBalanceAtom, positionsAtom, selectedPoolAtom } from 'store/pools.store';
import { OrderBlockE } from 'types/enums';

import styles from '../OrderSize.module.scss';
import { selectedCurrencyAtom } from '../store';

const multipliers = [0, 0.25, 0.5, 0.75, 1];

const valueLabelFormat = (value: number) => `${value}%`;

export const maxOrderSizeAtom = atom((get) => {
  const selectedPool = get(selectedPoolAtom);
  const leverage = get(leverageAtom);
  const poolTokenBalance = get(poolTokenBalanceAtom);
  const orderBlock = get(orderBlockAtom);
  const selectedCurrency = get(selectedCurrencyAtom);
  if (!poolTokenBalance || !selectedPool) return;

  const buffer = (1.0005 + leverage * 0.008) * 1.01;
  const selectedPerpetual = selectedPool.perpetuals.find((perpetual) => perpetual.baseCurrency === selectedCurrency);
  if (!selectedPerpetual) return;
  const { collToQuoteIndexPrice, indexPrice } = selectedPerpetual;
  let collateralCC = 0;
  if (orderBlock !== OrderBlockE.Long) {
    const positions = get(positionsAtom);
    const openPosition = positions.find(
      (position) =>
        position.symbol ===
        `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}-${selectedPool.poolSymbol}`
    );
    collateralCC = openPosition?.collateralCC || 0;
  }
  const max = (poolTokenBalance + collateralCC * leverage * collToQuoteIndexPrice) / (indexPrice * buffer);

  return max;
});

export const setSizeFromSliderAtom = atom(
  (get) => {
    const max = get(maxOrderSizeAtom);
    if (!max) return 0;
    const orderSize = get(orderSizeAtom);

    const percent = (orderSize * 100) / max;
    console.log('percent :>> ', { percent, orderSize, max });

    return percent;
  },
  async (get, set, percent: number) => {
    const max = get(maxOrderSizeAtom);
    if (!max) return;
    const orderSize = (max * percent) / 100;
    console.log('orderSize :>> ', { percent, orderSize, max });

    set(orderSizeAtom, orderSize);

    return orderSize;
  }
);

export const OrderSizeSlider = () => {
  const marks = useMemo(
    () => multipliers.map((multiplier) => ({ value: multiplier * 100, label: `${multiplier}%` })),
    []
  );

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

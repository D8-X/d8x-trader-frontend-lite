import { useAtom } from 'jotai';
import { memo, useCallback, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Slider,
  Typography,
} from '@mui/material';

import { ReactComponent as SettingsIcon } from 'assets/icons/settingsIcon.svg';
import { Dialog } from 'components/dialog/Dialog';
// import { createSymbol } from 'helpers/createSymbol';
import {
  // keepPositionLeverageAtom,
  orderBlockAtom,
  orderTypeAtom,
  reduceOnlyAtom,
  slippageSliderAtom,
} from 'store/order-block.store';
import { perpetualStatisticsAtom, selectedPerpetualAtom /*, positionsAtom*/ } from 'store/pools.store';
import { OrderBlockE, OrderTypeE, ToleranceE } from 'types/enums';
import { MarkI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';
import { mapSlippageToNumber } from 'utils/mapSlippageToNumber';

import styles from './OrderSettings.module.scss';

const marks: MarkI[] = [
  { value: 1, label: '0.1%' },
  { value: 2, label: '0.5%' },
  { value: 3, label: '1%' },
  { value: 4, label: '1.5%' },
  { value: 5, label: '2%' },
  { value: 6, label: '3%' },
  { value: 7, label: '4%' },
  { value: 8, label: '5%' },
];

const sliderToToleranceMap: Record<number, ToleranceE> = {
  1: ToleranceE['0.1%'],
  2: ToleranceE['0.5%'],
  3: ToleranceE['1%'],
  4: ToleranceE['1.5%'],
  5: ToleranceE['2%'],
  6: ToleranceE['3%'],
  7: ToleranceE['4%'],
  8: ToleranceE['5%'],
};

function valueLabelFormat(value: number) {
  return `${sliderToToleranceMap[value]}%`;
}

export const OrderSettings = memo(() => {
  // const [positions] = useAtom(positionsAtom);
  const [orderBlock] = useAtom(orderBlockAtom);
  const [orderType] = useAtom(orderTypeAtom);
  const [slippage, setSlippage] = useAtom(slippageSliderAtom);
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  // const [keepPositionLeverage, setKeepPositionLeverage] = useAtom(keepPositionLeverageAtom);
  const [reduceOnly, setReduceOnly] = useAtom(reduceOnlyAtom);

  const [updatedSlippage, setUpdatedSlippage] = useState(4);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const openSettingsModal = useCallback(() => setShowSettingsModal(true), []);

  const closeSettingsModal = useCallback(() => {
    setUpdatedSlippage(slippage);
    setShowSettingsModal(false);
  }, [slippage]);

  const handleSettingsConfirm = useCallback(() => {
    setShowSettingsModal(false);
    setSlippage(updatedSlippage);
  }, [updatedSlippage, setSlippage]);

  const handleToleranceChange = useCallback((_event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      setUpdatedSlippage(newValue);
    }
  }, []);

  const entryPrice = useMemo(() => {
    if (perpetualStatistics) {
      return (
        perpetualStatistics.midPrice *
        (1 + mapSlippageToNumber(updatedSlippage) * (orderBlock === OrderBlockE.Long ? 1 : -1))
      );
    }
    return 0;
  }, [orderBlock, updatedSlippage, perpetualStatistics]);

  // const isKeepPosLeverageDisabled = useMemo(() => {
  //   if (perpetualStatistics) {
  //     const symbol = createSymbol({
  //       baseCurrency: perpetualStatistics.baseCurrency,
  //       quoteCurrency: perpetualStatistics.quoteCurrency,
  //       poolSymbol: perpetualStatistics.poolName,
  //     });
  //
  //     return !positions.find((position) => position.symbol === symbol);
  //   }
  //   return true;
  // }, [perpetualStatistics, positions]);

  return (
    <>
      <Box className={styles.root}>
        <Box className={styles.keepPosLeverage}>
          {/*<FormControlLabel
            id="keep-position-leverage"
            value="true"
            defaultChecked={keepPositionLeverage}
            disabled={isKeepPosLeverageDisabled}
            onChange={(_event, checked) => setKeepPositionLeverage(checked)}
            control={keepPositionLeverage ? <Checkbox checked={true} /> : <Checkbox checked={false} />}
            label="Keep pos. leverage"
            labelPlacement="end"
          />*/}
        </Box>
        <Box className={styles.settings}>
          {orderType === OrderTypeE.Market && (
            <>
              <SettingsIcon className={styles.settingsIcon} onClick={openSettingsModal} />
              <Typography variant="bodyTiny">Slippage settings</Typography>
            </>
          )}
          {orderType !== OrderTypeE.Market && (
            <FormControlLabel
              id="reduce-only"
              value="true"
              defaultChecked={reduceOnly}
              onChange={(_event, checked) => setReduceOnly(checked)}
              control={reduceOnly ? <Checkbox checked={true} /> : <Checkbox checked={false} />}
              label="Reduce only"
              labelPlacement="end"
            />
          )}
        </Box>
      </Box>
      <Dialog open={showSettingsModal}>
        <DialogTitle>Slippage settings</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <Typography variant="body1">Slippage tolerance</Typography>
          <Slider
            aria-label="Slippage tolerance values"
            value={updatedSlippage}
            min={1}
            max={8}
            step={1}
            getAriaValueText={valueLabelFormat}
            valueLabelFormat={valueLabelFormat}
            valueLabelDisplay="auto"
            marks={marks}
            onChange={handleToleranceChange}
          />
          <Typography variant="body2" className={styles.maxEntryPrice}>
            {orderBlock === OrderBlockE.Long ? 'Max' : 'Min'} entry price:{' '}
            {formatToCurrency(entryPrice, selectedPerpetual?.quoteCurrency)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSettingsModal} variant="secondary" size="small">
            Cancel
          </Button>
          <Button onClick={handleSettingsConfirm} variant="primary" size="small">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

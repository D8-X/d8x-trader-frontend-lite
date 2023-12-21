import { useAtom } from 'jotai';
import { type ChangeEvent, memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  OutlinedInput,
  Slider,
  Typography,
} from '@mui/material';

import { ReactComponent as SettingsIcon } from 'assets/icons/settingsIcon.svg';
import { Dialog } from 'components/dialog/Dialog';
import { ExpirySelector } from 'components/order-block/elements/expiry-selector/ExpirySelector';
import { Separator } from 'components/separator/Separator';
import { orderBlockAtom, orderTypeAtom, reduceOnlyAtom, slippageSliderAtom } from 'store/order-block.store';
import { perpetualStatisticsAtom, selectedPerpetualAtom } from 'store/pools.store';
import { OrderBlockE, OrderTypeE } from 'types/enums';
import { type MarkI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';
import { mapSlippageToNumber } from 'utils/mapSlippageToNumber';

import styles from './OrderSettings.module.scss';

const marks: MarkI[] = [
  { value: 0.5, label: '0.5%' },
  { value: 1, label: '1%' },
  { value: 1.5, label: '1.5%' },
  { value: 2, label: '2%' },
  { value: 2.5, label: '2.5%' },
  { value: 3, label: '3%' },
  { value: 3.5, label: '3.5%' },
  { value: 4, label: '4%' },
  { value: 4.5, label: '4.5%' },
  { value: 5, label: '5%' },
];

function valueLabelFormat(value: number) {
  return `${value}%`;
}

const MIN_SLIPPAGE = 0.5;
const MAX_SLIPPAGE = 5;

export const OrderSettings = memo(() => {
  const { t } = useTranslation();
  // const [positions] = useAtom(positionsAtom);
  const [orderBlock] = useAtom(orderBlockAtom);
  const [orderType] = useAtom(orderTypeAtom);
  const [slippage, setSlippage] = useAtom(slippageSliderAtom);
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  // const [keepPositionLeverage, setKeepPositionLeverage] = useAtom(keepPositionLeverageAtom);
  const [reduceOnly, setReduceOnly] = useAtom(reduceOnlyAtom);

  const [updatedSlippage, setUpdatedSlippage] = useState(2);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [inputValue, setInputValue] = useState(`${updatedSlippage}`);

  const updateSlippage = (value: number) => {
    setUpdatedSlippage(value);
    setInputValue(`${value}`);
  };

  const closeSettingsModal = () => {
    updateSlippage(slippage);
    setShowSettingsModal(false);
  };

  const handleSettingsConfirm = () => {
    setShowSettingsModal(false);
    setSlippage(updatedSlippage);
  };

  console.log(slippage);
  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const targetValue = event.target.value;
    if (targetValue) {
      const valueNumber = Number(targetValue);
      let valueToSet;
      if (valueNumber < MIN_SLIPPAGE) {
        valueToSet = MIN_SLIPPAGE;
      } else if (valueNumber > MAX_SLIPPAGE) {
        valueToSet = MAX_SLIPPAGE;
      } else {
        valueToSet = valueNumber;
      }
      updateSlippage(valueToSet);
    } else {
      setUpdatedSlippage(MIN_SLIPPAGE);
      setInputValue('');
    }
  };

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

        {orderType === OrderTypeE.Market && (
          <Box className={styles.settings} onClick={() => setShowSettingsModal(true)}>
            <SettingsIcon className={styles.settingsIcon} />
            <Typography variant="bodyTiny">{t('pages.trade.order-block.slippage.title')}</Typography>
          </Box>
        )}
        {orderType !== OrderTypeE.Market && (
          <Box className={styles.settings}>
            <FormControlLabel
              id="reduce-only"
              value="true"
              defaultChecked={reduceOnly}
              onChange={(_event, checked) => setReduceOnly(checked)}
              control={<Checkbox checked={reduceOnly} />}
              label={t('pages.trade.order-block.reduce-only')}
              labelPlacement="end"
            />
            <Box className={styles.settings} onClick={() => setShowExpiryModal(true)}>
              <SettingsIcon className={styles.settingsIcon} />
              <Typography variant="bodyTiny">{t('pages.trade.order-block.expiry.title')}</Typography>
            </Box>
          </Box>
        )}
      </Box>
      <Dialog open={showSettingsModal} className={styles.dialog}>
        <DialogTitle>{t('pages.trade.order-block.slippage.title')}</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <Typography variant="bodyMedium">{t('pages.trade.order-block.slippage.body')}</Typography>
          <Box className={styles.sliderHolder}>
            <Slider
              aria-label="Slippage tolerance values"
              value={updatedSlippage}
              min={MIN_SLIPPAGE}
              max={MAX_SLIPPAGE}
              step={0.5}
              getAriaValueText={valueLabelFormat}
              valueLabelFormat={valueLabelFormat}
              valueLabelDisplay="auto"
              marks={marks}
              onChange={(_event, newValue) => {
                if (typeof newValue === 'number') {
                  updateSlippage(newValue);
                }
              }}
            />
          </Box>
          <Box className={styles.slippageBox}>
            <OutlinedInput
              id="slippage"
              type="number"
              inputProps={{ min: MIN_SLIPPAGE, max: MAX_SLIPPAGE, step: 0.5 }}
              endAdornment={
                <InputAdornment position="end">
                  <Typography variant="adornment">%</Typography>
                </InputAdornment>
              }
              onChange={handleInputChange}
              value={inputValue}
            />
          </Box>
          <Typography variant="body2" className={styles.maxEntryPrice}>
            {orderBlock === OrderBlockE.Long
              ? t('pages.trade.order-block.slippage.max')
              : t('pages.trade.order-block.slippage.min')}{' '}
            {formatToCurrency(entryPrice, selectedPerpetual?.quoteCurrency)}
          </Typography>
        </DialogContent>
        <Separator />
        <DialogActions>
          <Button onClick={closeSettingsModal} variant="secondary" size="small">
            {t('pages.trade.order-block.slippage.cancel')}
          </Button>
          <Button onClick={handleSettingsConfirm} variant="primary" size="small">
            {t('pages.trade.order-block.slippage.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showExpiryModal} className={styles.dialog} onClose={() => setShowExpiryModal(false)}>
        <DialogTitle>{t('pages.trade.order-block.expiry.title')}</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <Typography variant="bodyMedium">{t('pages.trade.order-block.expiry.body')}</Typography>
        </DialogContent>
        <Box className={styles.expiryBox}>
          <ExpirySelector />
        </Box>
        <Separator />
        <DialogActions className={styles.dialogAction}>
          <Button onClick={() => setShowExpiryModal(false)} variant="secondary" size="small">
            {t('pages.trade.order-block.expiry.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

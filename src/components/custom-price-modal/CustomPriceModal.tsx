import classnames from 'classnames';
import { useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { useStopLoss } from 'components/order-block/elements/stop-loss-selector/useStopLoss';
import { useTakeProfit } from 'components/order-block/elements/take-profit-selector/useTakeProfit';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { TradingViewChart } from 'components/trading-view-chart/TradingViewChart';
import { calculateStepSize } from 'helpers/calculateStepSize';
import { stopLossModalOpenAtom, takeProfitModalOpenAtom } from 'store/global-modals.store';
import {
  stopLossAtom,
  stopLossInputPriceAtom,
  takeProfitAtom,
  takeProfitInputPriceAtom,
} from 'store/order-block.store';
import { selectedPerpetualAtom } from 'store/pools.store';
import { StopLossE, TakeProfitE } from 'types/enums';

import styles from './CustomPriceModal.module.scss';

export const CustomPriceModal = () => {
  const { t } = useTranslation();

  const [isStopLossModalOpen, setStopLossModalOpen] = useAtom(stopLossModalOpenAtom);
  const [isTakeProfitModalOpen, setTakeProfitModalOpen] = useAtom(takeProfitModalOpenAtom);
  const stopLoss = useAtomValue(stopLossAtom);
  const stopLossInputPrice = useAtomValue(stopLossInputPriceAtom);
  const takeProfit = useAtomValue(takeProfitAtom);
  const takeProfitInputPrice = useAtomValue(takeProfitInputPriceAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);

  const { handleStopLossPriceChange, handleStopLossChange, validateStopLossPrice } = useStopLoss();
  const { handleTakeProfitPriceChange, handleTakeProfitChange, validateTakeProfitPrice } = useTakeProfit();

  const stepSize = useMemo(() => calculateStepSize(selectedPerpetual?.indexPrice), [selectedPerpetual?.indexPrice]);

  const handleOnClose = () => {
    setTakeProfitModalOpen(false);
    setStopLossModalOpen(false);
  };

  const handleStopLossClick = () => {
    setTakeProfitModalOpen(false);
    setStopLossModalOpen(true);
  };

  const handleTakeProfitClick = () => {
    setStopLossModalOpen(false);
    setTakeProfitModalOpen(true);
  };

  const stopLossTranslationMap: Record<StopLossE, string> = {
    [StopLossE.None]: t('pages.trade.order-block.stop-loss.none'),
    [StopLossE['5%']]: '5%',
    [StopLossE['25%']]: '25%',
    [StopLossE['50%']]: '50%',
    [StopLossE['75%']]: '75%',
  };

  const takeProfitTranslationMap: Record<TakeProfitE, string> = {
    [TakeProfitE.None]: t('pages.trade.order-block.take-profit.none'),
    [TakeProfitE['5%']]: '5%',
    [TakeProfitE['50%']]: '50%',
    [TakeProfitE['100%']]: '100%',
    [TakeProfitE['500%']]: '500%',
  };

  return (
    <Dialog
      open={isStopLossModalOpen || isTakeProfitModalOpen}
      onClose={handleOnClose}
      onCloseClick={handleOnClose}
      className={styles.dialog}
      dialogTitle={t(`pages.trade.order-block.${isStopLossModalOpen ? 'stop-loss' : 'take-profit'}.title`)}
    >
      <div className={styles.customPrices}>
        <div
          className={classnames(styles.stopLoss, { [styles.active]: isStopLossModalOpen })}
          onClick={handleStopLossClick}
        >
          <span className={styles.price}>
            <DynamicLogo
              logoName={selectedPerpetual?.quoteCurrency.toLowerCase() ?? ''}
              width={24}
              height={24}
              className={styles.currencyIcon}
            />
            <span>{stopLossInputPrice || '--'}</span>
          </span>
          <span className={styles.label}>{t('pages.trade.order-block.stop-loss.title')}</span>
        </div>
        <div
          className={classnames(styles.takeProfit, { [styles.active]: isTakeProfitModalOpen })}
          onClick={handleTakeProfitClick}
        >
          <span className={styles.price}>
            <DynamicLogo
              logoName={selectedPerpetual?.quoteCurrency.toLowerCase() ?? ''}
              width={24}
              height={24}
              className={styles.currencyIcon}
            />
            <span>{takeProfitInputPrice || '--'}</span>
          </span>
          <span className={styles.label}>{t('pages.trade.order-block.take-profit.title')}</span>
        </div>
      </div>
      <div className={styles.chartHolder}>
        <TradingViewChart
          onlyChart
          height={350}
          takeProfitPrice={takeProfitInputPrice}
          stopLossPrice={stopLossInputPrice}
        />
      </div>
      <div className={styles.actionHolder}>
        {isStopLossModalOpen && (
          <div className={styles.priceCustomization}>
            <div className={styles.priceOptions}>
              {Object.values(StopLossE).map((key) => (
                <Button
                  key={key}
                  variant="secondary"
                  className={classnames({ [styles.selected]: key === stopLoss })}
                  onClick={() => handleStopLossChange(key)}
                >
                  {stopLossTranslationMap[key]}
                </Button>
              ))}
            </div>
            <ResponsiveInput
              id="stop-loss-price"
              className={styles.responsiveInput}
              inputClassName={styles.input}
              inputValue={stopLossInputPrice != null ? stopLossInputPrice : ''}
              placeholder="-"
              step={stepSize}
              min={0}
              setInputValue={handleStopLossPriceChange}
              handleInputBlur={validateStopLossPrice}
            />
          </div>
        )}
        {isTakeProfitModalOpen && (
          <div className={styles.priceCustomization}>
            <div className={styles.priceOptions}>
              {Object.values(TakeProfitE).map((key) => (
                <Button
                  key={key}
                  variant="secondary"
                  className={classnames({ [styles.selected]: key === takeProfit })}
                  onClick={() => handleTakeProfitChange(key)}
                >
                  {takeProfitTranslationMap[key]}
                </Button>
              ))}
            </div>
            <ResponsiveInput
              id="take-profit-price"
              className={styles.responsiveInput}
              inputClassName={styles.input}
              inputValue={takeProfitInputPrice != null ? takeProfitInputPrice : ''}
              placeholder="-"
              step={stepSize}
              min={0}
              setInputValue={handleTakeProfitPriceChange}
              handleInputBlur={validateTakeProfitPrice}
            />
          </div>
        )}
      </div>
    </Dialog>
  );
};

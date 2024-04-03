import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Link, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { hasPositionAtom } from 'store/strategies.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './EnterStrategy.module.scss';

export const EnterStrategy = () => {
  const { t } = useTranslation();

  const setHasPosition = useSetAtom(hasPositionAtom);

  const [addAmount, setAddAmount] = useState(0);
  const [inputValue, setInputValue] = useState(`${addAmount}`);

  const inputValueChangedRef = useRef(false);

  const handleInputCapture = useCallback((orderSizeValue: string) => {
    if (orderSizeValue) {
      setAddAmount(+orderSizeValue);
      setInputValue(orderSizeValue);
    } else {
      setAddAmount(0);
      setInputValue('');
    }
    inputValueChangedRef.current = true;
  }, []);

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${addAmount}`);
    }
    inputValueChangedRef.current = false;
  }, [addAmount]);

  // TODO: Get data from blockchain
  const weEthBalance = 2.345;

  return (
    <div className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {t('pages.strategies.enter.title')}
      </Typography>
      <div className={styles.inputLine}>
        <div className={styles.labelHolder}>
          <InfoLabelBlock title={t('common.amount-label')} content={t('pages.strategies.enter.amount-info')} />
        </div>
        <ResponsiveInput
          id="enter-amount-size"
          className={styles.inputHolder}
          inputValue={inputValue}
          setInputValue={handleInputCapture}
          currency="weETH"
          step="0.001"
          min={0}
          max={weEthBalance || 0}
        />
      </div>
      {weEthBalance ? (
        <Typography className={styles.helperText} variant="bodyTiny">
          {t('common.max')}{' '}
          <Link
            onClick={() => {
              if (weEthBalance) {
                handleInputCapture(`${weEthBalance}`);
              }
            }}
          >
            {formatToCurrency(weEthBalance, 'weETH')}
          </Link>
        </Typography>
      ) : null}
      <Button onClick={() => setHasPosition(true)} className={styles.button} variant="primary">
        <span className={styles.modalButtonText}>{t('pages.strategies.enter.deposit-button')}</span>
      </Button>
    </div>
  );
};

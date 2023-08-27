import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChainId, useNetwork } from 'wagmi';

import { AccountBalanceOutlined } from '@mui/icons-material';
import { Box, MenuItem, useMediaQuery, useTheme } from '@mui/material';

import { useCandlesWebSocketContext } from 'context/websocket-context/candles/useCandlesWebSocketContext';
import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { getPerpetualStaticInfo } from 'network/network';
import { clearInputsDataAtom } from 'store/order-block.store';
import {
  perpetualStaticInfoAtom,
  perpetualStatisticsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { candlesAtom, candlesDataReadyAtom, newCandlesAtom, selectedPeriodAtom } from 'store/tv-chart.store';
import type { PerpetualI } from 'types/types';

import { HeaderSelect } from '../header-select/HeaderSelect';
import { SelectItemI } from '../header-select/types';

import styles from '../header-select/HeaderSelect.module.scss';

const OptionsHeader = () => {
  const { t } = useTranslation();

  return (
    <MenuItem className={styles.optionsHeader} disabled>
      <Box className={styles.leftLabel}>{t('common.select.perpetual.headers.pair')}</Box>
      <Box className={styles.rightLabel}>{t('common.select.perpetual.headers.status')}</Box>
    </MenuItem>
  );
};

interface PerpetualsSelectPropsI {
  withNavigate?: boolean;
}

export const PerpetualsSelect = memo(({ withNavigate }: PerpetualsSelectPropsI) => {
  const { chain } = useNetwork();
  const chainId = useChainId();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { isConnected, send } = useCandlesWebSocketContext();

  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPerpetual, setSelectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPeriod] = useAtom(selectedPeriodAtom);
  const setPerpetualStatistics = useSetAtom(perpetualStatisticsAtom);
  const setPerpetualStaticInfo = useSetAtom(perpetualStaticInfoAtom);
  const setCandles = useSetAtom(candlesAtom);
  const setNewCandles = useSetAtom(newCandlesAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);

  const traderAPIRef = useRef(traderAPI);
  const urlChangesAppliedRed = useRef(false);

  useEffect(() => {
    if (!location.hash || !selectedPool || !selectedPerpetual || urlChangesAppliedRed.current) {
      return;
    }

    const symbolHash = location.hash.slice(1);
    const result = parseSymbol(symbolHash);
    if (!result) {
      return;
    }

    if (
      selectedPerpetual.quoteCurrency === result.quoteCurrency &&
      selectedPerpetual.baseCurrency === result.baseCurrency
    ) {
      return;
    }

    urlChangesAppliedRed.current = true;
    const foundPerpetual = selectedPool.perpetuals.find(
      (perpetual) => perpetual.quoteCurrency === result.quoteCurrency && perpetual.baseCurrency === result.baseCurrency
    );
    if (foundPerpetual) {
      setSelectedPerpetual(foundPerpetual.id);
    }
  }, [location.hash, selectedPool, selectedPerpetual, setSelectedPerpetual]);

  const symbol = useMemo(() => {
    if (selectedPool && selectedPerpetual) {
      return createSymbol({
        baseCurrency: selectedPerpetual.baseCurrency,
        quoteCurrency: selectedPerpetual.quoteCurrency,
        poolSymbol: selectedPool.poolSymbol,
      });
    }
    return '';
  }, [selectedPool, selectedPerpetual]);

  useEffect(() => {
    if (selectedPool && selectedPerpetual) {
      setPerpetualStatistics({
        id: selectedPerpetual.id,
        baseCurrency: selectedPerpetual.baseCurrency,
        quoteCurrency: selectedPerpetual.quoteCurrency,
        poolName: selectedPool.poolSymbol,
        midPrice: selectedPerpetual.midPrice,
        markPrice: selectedPerpetual.markPrice,
        indexPrice: selectedPerpetual.indexPrice,
        currentFundingRateBps: selectedPerpetual.currentFundingRateBps,
        openInterestBC: selectedPerpetual.openInterestBC,
      });
    }
  }, [selectedPool, selectedPerpetual, setPerpetualStatistics]);

  useEffect(() => {
    if (selectedPerpetual && isConnected) {
      send(JSON.stringify({ type: 'unsubscribe' }));
      send(
        JSON.stringify({
          type: 'subscribe',
          symbol: `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}`,
          period: selectedPeriod,
        })
      );
      setNewCandles([]);
      setCandlesDataReady(false);
    }
  }, [selectedPerpetual, selectedPeriod, setCandles, setNewCandles, setCandlesDataReady, isConnected, send]);

  useEffect(() => {
    if (symbol && chainId && chainId === chain?.id) {
      getPerpetualStaticInfo(chainId, traderAPIRef.current, symbol)
        .then(({ data }) => {
          setPerpetualStaticInfo(data);
        })
        .catch(console.error);
    }
  }, [chain, chainId, symbol, setPerpetualStaticInfo]);

  const handleChange = (newItem: PerpetualI) => {
    setSelectedPerpetual(newItem.id);
    if (withNavigate) {
      navigate(
        `${location.pathname}${location.search}#${newItem.baseCurrency}-${newItem.quoteCurrency}-${selectedPool?.poolSymbol}`
      );
    }
    clearInputsData();
  };

  const selectItems: SelectItemI<PerpetualI>[] = useMemo(() => {
    return (selectedPool?.perpetuals ?? []).map((perpetual) => ({ value: `${perpetual.id}`, item: perpetual }));
  }, [selectedPool]);

  return (
    <Box className={styles.holderRoot}>
      <Box className={styles.iconWrapper}>
        <AccountBalanceOutlined />
      </Box>
      <HeaderSelect<PerpetualI>
        id="perpetuals-select"
        label={t('common.select.perpetual.label')}
        native={isMobileScreen}
        items={selectItems}
        width="100%"
        value={`${selectedPerpetual?.id}`}
        handleChange={handleChange}
        OptionsHeader={OptionsHeader}
        renderLabel={(value) => `${value.baseCurrency}/${value.quoteCurrency}`}
        renderOption={(option) =>
          isMobileScreen ? (
            <option key={option.value} value={option.value}>
              {option.item.baseCurrency}/{option.item.quoteCurrency}
            </option>
          ) : (
            <MenuItem key={option.value} value={option.value} selected={option.value === `${selectedPerpetual?.id}`}>
              <Box className={styles.optionHolder}>
                <Box className={styles.label}>
                  {option.item.baseCurrency}/{option.item.quoteCurrency}
                </Box>
                <Box className={styles.value}>{option.item.isMarketClosed ? 'CLOSED' : 'OPEN'}</Box>
              </Box>
            </MenuItem>
          )
        }
      />
    </Box>
  );
});

import { useAtom } from 'jotai/index';
import { memo, SyntheticEvent, useEffect, useMemo, useRef } from 'react';
import { useNetwork } from 'wagmi';

import { Box, Paper, Popper, PopperProps } from '@mui/material';
import { PaperProps } from '@mui/material/Paper/Paper';

import { ReactComponent as PerpetualIcon } from 'assets/icons/perpetualIcon.svg';

import { useCandlesWebSocketContext } from 'context/websocket-context/candles/useCandlesWebSocketContext';
import { createSymbol } from 'helpers/createSymbol';
import { getPerpetualStaticInfo } from 'network/network';
import { clearInputsDataAtom } from 'store/order-block.store';
import {
  chainIdAtom,
  perpetualStaticInfoAtom,
  perpetualStatisticsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { candlesAtom, candlesDataReadyAtom, newCandlesAtom, selectedPeriodAtom } from 'store/tv-chart.store';
import { PerpetualI } from 'types/types';

import { HeaderSelect } from '../header-select/HeaderSelect';

import styles from '../header-select/HeaderSelect.module.scss';

const CustomPaper = ({ children, ...props }: PaperProps) => {
  return (
    <Paper elevation={8} {...props}>
      <Box className={styles.optionsHeader}>
        <Box className={styles.leftLabel}>Pair</Box>
        <Box className={styles.rightLabel}>Status</Box>
      </Box>
      <Box className={styles.optionsHolder}>{children}</Box>
    </Paper>
  );
};

const CustomPopper = (props: PopperProps) => {
  return <Popper {...props} placement="auto" />;
};

export const PerpetualsSelect = memo(() => {
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPerpetual, setSelectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPeriod] = useAtom(selectedPeriodAtom);
  const [, setPerpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const [, setPerpetualStaticInfo] = useAtom(perpetualStaticInfoAtom);
  const [, setCandles] = useAtom(candlesAtom);
  const [, setNewCandles] = useAtom(newCandlesAtom);
  const [, setCandlesDataReady] = useAtom(candlesDataReadyAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [, clearInputsData] = useAtom(clearInputsDataAtom);
  const [chainId] = useAtom(chainIdAtom);

  const traderAPIRef = useRef(traderAPI);
  const { chain } = useNetwork();

  // const chainId = useChainId();

  const { isConnected, send } = useCandlesWebSocketContext();

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
      getPerpetualStaticInfo(chainId, traderAPIRef.current, symbol).then(({ data }) => {
        setPerpetualStaticInfo(data);
      });
    }
  }, [chain, chainId, symbol, setPerpetualStaticInfo]);

  const handleChange = (event: SyntheticEvent, value: PerpetualI) => {
    setSelectedPerpetual(value.id);
    clearInputsData();
  };

  return (
    <Box className={styles.holderRoot}>
      <Box className={styles.iconWrapper}>
        <PerpetualIcon />
      </Box>
      <HeaderSelect<PerpetualI>
        id="perpetuals-select"
        label="Perpetual"
        items={selectedPool?.perpetuals ?? []}
        width="100%"
        value={selectedPerpetual}
        onChange={handleChange}
        PaperComponent={CustomPaper}
        PopperComponent={CustomPopper}
        getOptionLabel={(option) => `${option.baseCurrency}/${option.quoteCurrency}`}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box className={styles.optionHolder}>
              <Box className={styles.label}>
                {option.baseCurrency}/{option.quoteCurrency}
              </Box>
              <Box className={styles.value}>{option.isMarketClosed ? 'CLOSED' : 'OPEN'}</Box>
            </Box>
          </Box>
        )}
      />
    </Box>
  );
});

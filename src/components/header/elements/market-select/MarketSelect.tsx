import classnames from 'classnames';
import { useAtom, useSetAtom } from 'jotai';
import { Suspense, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount, useChainId, useNetwork } from 'wagmi';

import { AccountBalanceOutlined, ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Button, DialogActions, DialogContent, MenuItem, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { useCandlesWebSocketContext } from 'context/websocket-context/candles/useCandlesWebSocketContext';
import { useWebSocketContext } from 'context/websocket-context/d8x/useWebSocketContext';
import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { getPerpetualStaticInfo } from 'network/network';
import { clearInputsDataAtom } from 'store/order-block.store';
import {
  perpetualStaticInfoAtom,
  perpetualStatisticsAtom,
  poolsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { candlesDataReadyAtom, marketsDataAtom, newCandleAtom, selectedPeriodAtom } from 'store/tv-chart.store';
import { getDynamicLogo } from 'utils/tokens';

import type { SelectItemI } from '../header-select/types';
import { CollateralFilter } from './components/collateral-filter/CollateralFilter';
import { Filters } from './components/filters/Filters';
import { SearchInput } from './components/search-input/SearchInput';
import { PerpetualWithPoolAndMarketI } from './types';
import { useMarketsFilter } from './useMarketsFilter';

import styles from './MarketSelect.module.scss';

const OptionsHeader = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className={styles.optionsHeader}>
        <div className={styles.header}>{t('common.select.market.header')}</div>
      </div>
      <Separator />
      <div className={styles.controlsContainer}>
        <SearchInput />
        <CollateralFilter />
        <Filters />
      </div>
    </>
  );
};

const Option = memo(
  ({
    option,
    isSelected,
    onClick,
  }: {
    isSelected: boolean;
    option: SelectItemI<PerpetualWithPoolAndMarketI>;
    onClick: () => void;
  }) => {
    const IconComponent = useMemo(
      () => getDynamicLogo(option.item.baseCurrency.toLowerCase()),
      [option.item.baseCurrency]
    );
    const { t } = useTranslation();

    return (
      <MenuItem
        value={option.value}
        selected={isSelected}
        className={classnames({ [styles.selectedOption]: isSelected })}
        onClick={onClick}
      >
        <div className={styles.optionHolder}>
          <div className={styles.optionLeftBlock}>
            <div className={styles.iconHolder}>
              <Suspense fallback={null}>
                <IconComponent width={24} height={24} />
              </Suspense>
            </div>
            <Typography variant="bodySmall" className={styles.label}>
              {option.item.baseCurrency}/{option.item.quoteCurrency}
              <Typography variant="bodyTiny" component="div">
                {option.item.poolSymbol}
              </Typography>
            </Typography>
          </div>
          <div className={styles.optionRightBlock}>
            {option.item.marketData && option.item.marketData.isOpen ? (
              <>
                <Typography variant="bodySmall" className={styles.value}>
                  {option.item.marketData.currentPx.toFixed(2)}
                </Typography>
                <Typography
                  variant="bodyTiny"
                  className={classnames(styles.priceChange, {
                    [styles.buyPrice]: option.item.marketData.ret24hPerc > 0,
                    [styles.sellPrice]: option.item.marketData.ret24hPerc < 0,
                  })}
                >
                  {option.item.marketData.ret24hPerc.toFixed(2)}%
                </Typography>
              </>
            ) : (
              <Typography variant="bodySmall" className={styles.status}>
                {t('common.select.market.closed')}
              </Typography>
            )}
          </div>
        </div>
      </MenuItem>
    );
  }
);

interface MarketSelectPropsI {
  withNavigate?: boolean;
  updatePerpetual?: boolean;
}

export const MarketSelect = memo(({ withNavigate, updatePerpetual }: MarketSelectPropsI) => {
  const { t } = useTranslation();

  const { address } = useAccount();
  const { chain } = useNetwork();
  const chainId = useChainId();
  const navigate = useNavigate();
  const location = useLocation();

  const { isConnected, send } = useWebSocketContext();
  const { isConnected: isConnectedCandlesWs, send: sendToCandlesWs } = useCandlesWebSocketContext();

  const [pools] = useAtom(poolsAtom);
  const [selectedPeriod] = useAtom(selectedPeriodAtom);
  const [selectedPerpetual, setSelectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const setNewCandle = useSetAtom(newCandleAtom);
  const [marketsData] = useAtom(marketsDataAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);
  const setPerpetualStatistics = useSetAtom(perpetualStatisticsAtom);
  const setPerpetualStaticInfo = useSetAtom(perpetualStaticInfoAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);
  const [traderAPI] = useAtom(traderAPIAtom);

  const [isModalOpen, setModalOpen] = useState(false);

  const urlChangesAppliedRef = useRef(false);
  const topicRef = useRef('');
  const wsConnectedStateRef = useRef(false);

  useEffect(() => {
    if (!location.hash || urlChangesAppliedRef.current || !pools.length) {
      return;
    }

    urlChangesAppliedRef.current = true;

    const symbolHash = location.hash.slice(1);
    const result = parseSymbol(symbolHash);

    if (result) {
      setSelectedPool(result.poolSymbol);

      const foundPool = pools.find(({ poolSymbol }) => poolSymbol === result.poolSymbol);
      if (!foundPool) {
        return;
      }

      const foundPerpetual = foundPool.perpetuals.find(
        ({ baseCurrency, quoteCurrency }) =>
          baseCurrency === result.baseCurrency && quoteCurrency === result.quoteCurrency
      );
      if (foundPerpetual) {
        setSelectedPerpetual(foundPerpetual.id);
      }
    }
  }, [location.hash, selectedPool, setSelectedPool, setSelectedPerpetual, pools]);

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
    if (pools.length && isConnected && selectedPool?.poolId) {
      send(JSON.stringify({ type: 'unsubscribe' }));

      pools
        .filter((pool) => pool.poolId === selectedPool.poolId)
        .forEach((pool) => {
          pool.perpetuals.forEach(({ baseCurrency, quoteCurrency }) => {
            const symbol = createSymbol({
              baseCurrency,
              quoteCurrency,
              poolSymbol: pool.poolSymbol,
            });
            send(
              JSON.stringify({
                traderAddr: address ?? '',
                symbol,
              })
            );
          });
        });
    }
  }, [selectedPool?.poolId, pools, isConnected, send, address]);

  useEffect(() => {
    if (updatePerpetual && selectedPerpetual && isConnectedCandlesWs) {
      if (isConnectedCandlesWs !== wsConnectedStateRef.current) {
        sendToCandlesWs(JSON.stringify({ type: 'subscribe', topic: 'markets' }));
      }

      wsConnectedStateRef.current = isConnectedCandlesWs;

      const topicInfo = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}:${selectedPeriod}`;
      if (topicInfo !== topicRef.current) {
        if (topicRef.current) {
          sendToCandlesWs(JSON.stringify({ type: 'unsubscribe', topic: topicRef.current }));
        }
        topicRef.current = topicInfo;
        sendToCandlesWs(
          JSON.stringify({
            type: 'subscribe',
            topic: topicRef.current,
          })
        );
        setNewCandle(null);
        setCandlesDataReady(false);
      }
    } else if (!isConnectedCandlesWs) {
      wsConnectedStateRef.current = false;
      topicRef.current = '';
    }
  }, [
    updatePerpetual,
    selectedPerpetual,
    selectedPeriod,
    setNewCandle,
    setCandlesDataReady,
    isConnectedCandlesWs,
    sendToCandlesWs,
  ]);

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
    if (updatePerpetual && symbol && chainId && chainId === chain?.id) {
      getPerpetualStaticInfo(chainId, traderAPI, symbol)
        .then(({ data }) => {
          setPerpetualStaticInfo(data);
        })
        .catch(console.error);
    }
  }, [chain, chainId, symbol, setPerpetualStaticInfo, traderAPI, updatePerpetual]);

  const handleChange = (newItem: PerpetualWithPoolAndMarketI) => {
    setSelectedPool(newItem.poolSymbol);
    setSelectedPerpetual(newItem.id);

    if (withNavigate) {
      navigate(
        `${location.pathname}${location.search}#${newItem.baseCurrency}-${newItem.quoteCurrency}-${newItem.poolSymbol}`
      );
    }
    clearInputsData();
    setModalOpen(false);
  };

  const markets = useMemo(() => {
    const marketsList: SelectItemI<PerpetualWithPoolAndMarketI>[] = [];
    pools
      .filter((pool) => pool.isRunning)
      .forEach((pool) =>
        marketsList.push(
          ...pool.perpetuals.map((perpetual) => {
            const pairId = `${perpetual.baseCurrency}-${perpetual.quoteCurrency}`.toLowerCase();
            const marketData = marketsData.find((market) => market.symbol === pairId);

            return {
              value: perpetual.id.toString(),
              item: {
                ...perpetual,
                poolSymbol: pool.poolSymbol,
                symbol: createSymbol({
                  poolSymbol: pool.poolSymbol,
                  baseCurrency: perpetual.baseCurrency,
                  quoteCurrency: perpetual.quoteCurrency,
                }),
                marketData: marketData ?? null,
              },
            };
          })
        )
      );
    return marketsList;
  }, [pools, marketsData]);

  const filteredMarkets = useMarketsFilter(markets);

  return (
    <div className={styles.holderRoot}>
      <div className={styles.iconWrapper}>
        <AccountBalanceOutlined />
      </div>
      <Button onClick={() => setModalOpen(true)} className={styles.marketSelectButton} variant="outlined">
        <div className={styles.selectedMarketBlock}>
          <Typography variant="bodyTiny" className={styles.selectedMarketLabel}>
            {t('common.select.market.label')}
          </Typography>
          <div className={styles.selectedMarketValue}>
            <Typography variant="bodyLarge" className={styles.selectedMarketPerpetual}>
              {selectedPerpetual?.baseCurrency}/{selectedPerpetual?.quoteCurrency}
            </Typography>
            <Typography variant="bodyTiny">{selectedPool?.poolSymbol}</Typography>
          </div>
        </div>
        <div className={styles.arrowDropDown}>{isModalOpen ? <ArrowDropUp /> : <ArrowDropDown />}</div>
      </Button>

      <Dialog open={isModalOpen} className={styles.dialog} onClose={() => setModalOpen(false)} scroll="paper">
        <OptionsHeader />
        <Separator />
        <DialogContent />
        <div className={styles.optionList}>
          {filteredMarkets.map((market) => (
            <Option
              key={market.value}
              option={market}
              isSelected={market.item.id === selectedPerpetual?.id}
              onClick={() => handleChange(market.item)}
            />
          ))}
        </div>
        <DialogActions className={styles.dialogAction}>
          <Button onClick={() => setModalOpen(false)} variant="secondary" size="small">
            {t('common.info-modal.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

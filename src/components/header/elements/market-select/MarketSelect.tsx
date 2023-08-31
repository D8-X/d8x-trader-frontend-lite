import classnames from 'classnames';
import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount, useChainId, useNetwork } from 'wagmi';

import { Button, DialogActions, DialogContent, MenuItem, Typography } from '@mui/material';
import { ArrowDropDown, ArrowDropUp, AttachMoneyOutlined } from '@mui/icons-material';

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
import { candlesDataReadyAtom, newCandlesAtom, selectedPeriodAtom } from 'store/tv-chart.store';
import { tokensIconsMap } from 'utils/tokens';

import type { SelectItemI } from '../header-select/types';
import { CollateralFilter } from './components/collateral-filter/CollateralFilter';
import { SearchInput } from './components/search-input/SearchInput';
import { Filters } from './components/filters/Filters';
import { PerpetualWithPoolI } from './types';
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

const Option = ({
  option,
  isSelected,
  onClick,
}: {
  isSelected: boolean;
  option: SelectItemI<PerpetualWithPoolI>;
  onClick: () => void;
}) => {
  const IconComponent = tokensIconsMap[option.item.baseCurrency.toLowerCase()]?.icon ?? tokensIconsMap.default.icon;

  return (
    <MenuItem
      value={option.value}
      selected={isSelected}
      className={classnames({ [styles.selectedOption]: isSelected })}
      onClick={onClick}
    >
      <div className={styles.optionHolder}>
        <div className={styles.optionLeftBlock}>
          <IconComponent width={24} height={24} />
          <div className={styles.label}>
            {option.item.baseCurrency}/{option.item.quoteCurrency}
            <div>{option.item.poolSymbol}</div>
          </div>
        </div>
        <div className={styles.optionRightBlock}>
          <div className={styles.value}>{option.item.indexPrice.toFixed(2)}</div>
          <div className={styles.priceChange} style={{ color: option.item.indexPrice > 0 ? '#089981' : '#F23645' }}>
            +2.00%
          </div>
        </div>
      </div>
    </MenuItem>
  );
};

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
  const setNewCandles = useSetAtom(newCandlesAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);
  const setPerpetualStatistics = useSetAtom(perpetualStatisticsAtom);
  const setPerpetualStaticInfo = useSetAtom(perpetualStaticInfoAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);
  const [traderAPI] = useAtom(traderAPIAtom);

  const [isModalOpen, setModalOpen] = useState(false);

  const urlChangesAppliedRed = useRef(false);

  useEffect(() => {
    if (!location.hash || urlChangesAppliedRed.current) {
      return;
    }

    const symbolHash = location.hash.slice(1);
    const result = parseSymbol(symbolHash);
    urlChangesAppliedRed.current = true;
    if (result && selectedPool?.poolSymbol !== result.poolSymbol) {
      setSelectedPool(result.poolSymbol);
    }
  }, [location.hash, selectedPool, setSelectedPool]);

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
    if (pools.length && isConnected) {
      send(JSON.stringify({ type: 'unsubscribe' }));

      pools.forEach((pool) => {
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
  }, [pools, isConnected, send, address]);

  useEffect(() => {
    if (updatePerpetual && selectedPerpetual && isConnectedCandlesWs) {
      sendToCandlesWs(JSON.stringify({ type: 'unsubscribe' }));
      sendToCandlesWs(
        JSON.stringify({
          type: 'subscribe',
          symbol: `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}`,
          period: selectedPeriod,
        })
      );
      setNewCandles([]);
      setCandlesDataReady(false);
    }
  }, [
    updatePerpetual,
    selectedPerpetual,
    selectedPeriod,
    setNewCandles,
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

  const handleChange = (newItem: PerpetualWithPoolI) => {
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
    const marketsData: SelectItemI<PerpetualWithPoolI>[] = [];
    pools
      .filter((pool) => pool.isRunning)
      .forEach((pool) =>
        marketsData.push(
          ...pool.perpetuals.map((perpetual) => ({
            value: perpetual.id.toString(),
            // label: `${perpetual.baseCurrency}/${perpetual.quoteCurrency}`,
            item: {
              ...perpetual,
              poolSymbol: pool.poolSymbol,
              symbol: createSymbol({
                poolSymbol: pool.poolSymbol,
                baseCurrency: perpetual.baseCurrency,
                quoteCurrency: perpetual.quoteCurrency,
              }),
            },
          }))
        )
      );
    return marketsData;
  }, [pools]);

  const filteredMarkets = useMarketsFilter(markets);

  return (
    <div className={styles.holderRoot}>
      <div className={styles.iconWrapper}>
        <AttachMoneyOutlined />
      </div>
      <Button onClick={() => setModalOpen(true)} className={styles.marketSelectButton} variant="outlined">
        <div className={styles.selectedMarketBlock}>
          <Typography variant="bodyTiny" className={styles.selectedMarketLabel}>
            {t('common.select.market.label')}
          </Typography>
          <div className={styles.selectedMarketValue}>
            <Typography variant="bodyMedium" className={styles.selectedMarketPerpetual}>
              {selectedPerpetual?.baseCurrency}/{selectedPerpetual?.quoteCurrency}
            </Typography>
            <Typography variant="bodyTiny" className={styles.selectedMarketCollateral}>
              {selectedPool?.poolSymbol}
            </Typography>
          </div>
        </div>
        <div className={styles.arrowDropDown}>{isModalOpen ? <ArrowDropUp /> : <ArrowDropDown />}</div>
      </Button>

      <Dialog open={isModalOpen} className={styles.dialog} onClose={() => setModalOpen(false)} scroll="paper">
        <OptionsHeader />
        <Separator />
        <DialogContent className={styles.dialogContent}></DialogContent>
        {filteredMarkets.map((market) => (
          <Option
            key={market.value}
            option={market}
            isSelected={market.item.id === selectedPerpetual?.id}
            onClick={() => handleChange(market.item)}
          />
        ))}
        <DialogActions className={styles.dialogAction}>
          <Button onClick={() => setModalOpen(false)} variant="secondary" size="small">
            {t('common.info-modal.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

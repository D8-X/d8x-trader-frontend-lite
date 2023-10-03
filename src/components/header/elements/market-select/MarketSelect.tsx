import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { AccountBalanceOutlined, ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Button, DialogActions, DialogContent, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { clearInputsDataAtom } from 'store/order-block.store';
import { perpetualStatisticsAtom, poolsAtom, selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { marketsDataAtom } from 'store/tv-chart.store';

import type { SelectItemI } from '../header-select/types';
import { CollateralFilter } from './components/collateral-filter/CollateralFilter';
import { Filters } from './components/filters/Filters';
import { MarketOption } from './components/market-option/MarketOption';
import { SearchInput } from './components/search-input/SearchInput';
import { PerpetualWithPoolAndMarketI } from './types';
import { useMarketsFilter } from './useMarketsFilter';

import styles from './MarketSelect.module.scss';
import { useCandleMarketsSubscribe } from './useCandleMarketsSubscribe';
import { usePoolSubscribe } from './usePoolSubscribe';
import { useSetPerpetualInfo } from './useSetPerpetualInfo';

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

export const MarketSelect = memo(() => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();

  const [pools] = useAtom(poolsAtom);
  const [selectedPerpetual, setSelectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [marketsData] = useAtom(marketsDataAtom);
  const setPerpetualStatistics = useSetAtom(perpetualStatisticsAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);

  const [isModalOpen, setModalOpen] = useState(false);

  const urlChangesAppliedRef = useRef(false);

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

  usePoolSubscribe();
  useCandleMarketsSubscribe();
  useSetPerpetualInfo();

  const handleChange = (newItem: PerpetualWithPoolAndMarketI) => {
    setSelectedPool(newItem.poolSymbol);
    setSelectedPerpetual(newItem.id);

    navigate(
      `${location.pathname}${location.search}#${newItem.baseCurrency}-${newItem.quoteCurrency}-${newItem.poolSymbol}`
    );
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
            <MarketOption
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

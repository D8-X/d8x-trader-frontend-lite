import { TraderInterface } from '@d8x/perpetuals-sdk';
import classnames from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Button, Typography } from '@mui/material';

import ArrowDownIcon from 'assets/icons/new/arrowDown.svg?react';
import ArrowUpIcon from 'assets/icons/new/arrowUp.svg?react';
import { config } from 'config';
import { CurrencyBadge } from 'components/currency-badge/CurrencyBadge';
import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { useMarkets } from 'components/market-select-modal/hooks/useMarkets';
import type { StatDataI } from 'components/stats-line/types';
import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';
import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { calculateProbability } from 'helpers/calculateProbability';
import { marketSelectModalOpenAtom } from 'store/global-modals.store';
import { orderBlockAtom } from 'store/order-block.store';
import {
  perpetualStaticInfoAtom,
  perpetualStatisticsAtom,
  poolsAtom,
  selectedPerpetualAtom,
  selectedPerpetualVolumeAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { OrderBlockE } from 'types/enums';
import { cutBaseCurrency } from 'utils/cutBaseCurrency';
import { formatToCurrency } from 'utils/formatToCurrency';
import { isEnabledChain } from 'utils/isEnabledChain';
import { getEnabledChainId } from 'utils/getEnabledChainId';
import { switchChain } from 'utils/switchChain';

import styles from './MarketSelect.module.scss';
import { getPerpetualVolume } from 'network/graph';

export const MarketSelect = memo(() => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();

  const { isConnected, chainId } = useAccount();
  const pools = useAtomValue(poolsAtom);
  const orderBlock = useAtomValue(orderBlockAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const [selectedPerpetual, setSelectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [perpetualStatistics, setPerpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const [isMarketSelectModalOpen, setMarketSelectModalOpen] = useAtom(marketSelectModalOpenAtom);
  const [isChainSwitching, setIsChainSwitching] = useState(false);
  const [isUrlTriggered, setIsUrlTriggered] = useState(false);
  const urlChangesAppliedRef = useRef(false);
  const poolsLoadedRef = useRef(false);
  const chainIdFromUrl = parseInt(location.hash.split('__')[1]?.split('=')[1], 10);

  const setPerpetualVolume = useSetAtom(selectedPerpetualVolumeAtom);

  const markets = useMarkets();

  useEffect(() => {
    if (!location.hash) {
      urlChangesAppliedRef.current = false;
      setIsUrlTriggered(false);
      setIsChainSwitching(false);
      poolsLoadedRef.current = false;
    }
  }, [location.hash]);

  useEffect(() => {
    if (pools.length > 0) {
      poolsLoadedRef.current = true;
    }
  }, [pools]);

  useEffect(() => {
    if (!chainIdFromUrl || isUrlTriggered || !isConnected) {
      return;
    }

    if (chainId !== chainIdFromUrl) {
      setIsChainSwitching(true);
      urlChangesAppliedRef.current = false;
      poolsLoadedRef.current = false;

      switchChain(chainIdFromUrl)
        .then(() => {
          setIsUrlTriggered(true);
          setTimeout(() => {
            setIsChainSwitching(false);
          }, 1000);
        })
        .catch((error) => {
          console.error('Error switching chains:', error);
          setIsChainSwitching(false);
        });
    } else {
      setIsUrlTriggered(true);
    }
  }, [chainIdFromUrl, chainId, isConnected, isUrlTriggered]);

  useEffect(() => {
    if (isChainSwitching || urlChangesAppliedRef.current || !pools.length || !poolsLoadedRef.current) {
      return;
    }

    if (location.hash) {
      const symbolHash = location.hash.slice(1);
      const [marketPart] = symbolHash.split('__');
      const result = parseSymbol(marketPart);

      if (result) {
        const foundPool = pools.find(({ poolSymbol }) => poolSymbol === result.poolSymbol);
        if (foundPool) {
          setSelectedPool(result.poolSymbol);
          const foundPerpetual = foundPool.perpetuals.find(
            ({ baseCurrency, quoteCurrency }) =>
              baseCurrency === result.baseCurrency && quoteCurrency === result.quoteCurrency
          );
          if (foundPerpetual) {
            setSelectedPerpetual(foundPerpetual.id);
            urlChangesAppliedRef.current = true;
            return;
          }
        }
      }
    }

    if (!location.hash) {
      const chainIdForMarket = isEnabledChain(chainId) ? chainId : config.enabledChains[0];
      const defaultMarket = config.defaultMarket[chainIdForMarket];

      if (defaultMarket) {
        const result = parseSymbol(defaultMarket);
        if (result) {
          const foundPool = pools.find(({ poolSymbol }) => poolSymbol === result.poolSymbol);
          if (foundPool) {
            setSelectedPool(result.poolSymbol);
            const foundPerpetual = foundPool.perpetuals.find(
              ({ baseCurrency, quoteCurrency }) =>
                baseCurrency === result.baseCurrency && quoteCurrency === result.quoteCurrency
            );
            if (foundPerpetual) {
              setSelectedPerpetual(foundPerpetual.id);
              const hash = `${foundPerpetual.baseCurrency}-${foundPerpetual.quoteCurrency}-${foundPool.poolSymbol}`;
              const chainIdForThisURL = getEnabledChainId(chainId, location.hash);
              navigate(`${location.pathname}${location.search}#${hash}__chainId=${chainIdForThisURL}`);
            }
          }
        }
      }
    }

    urlChangesAppliedRef.current = true;
  }, [
    chainId,
    pools,
    location.hash,
    isChainSwitching,
    location.pathname,
    location.search,
    navigate,
    setSelectedPerpetual,
    setSelectedPool,
  ]);

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

  const graphQueryRef = useRef(false);
  useEffect(() => {
    if (chainId && selectedPerpetual && !graphQueryRef.current) {
      graphQueryRef.current = true;
      getPerpetualVolume(chainId, selectedPerpetual.id)
        .then((vol) => {
          console.log('perp', selectedPerpetual.baseCurrency, 'volume', vol);
          setPerpetualVolume(vol);
        })
        .catch((e) => {
          // rate limit?
          console.log(e);
        })
        .finally(() => {
          graphQueryRef.current = false;
        });
    }
  }, [chainId, selectedPerpetual, setPerpetualVolume]);

  let midPriceClass = styles.positive;
  if (perpetualStatistics?.midPriceDiff != null) {
    midPriceClass = perpetualStatistics?.midPriceDiff >= 0 ? styles.positive : styles.negative;
  }

  const [displayMidPrice, displayCcy] = useMemo(() => {
    if (!!perpetualStatistics && !!perpetualStaticInfo) {
      let isPredictionMarket = false;
      try {
        isPredictionMarket = TraderInterface.isPredictionMarketStatic(perpetualStaticInfo);
      } catch {
        // skip
      }
      const px = perpetualStatistics.midPrice;

      return isPredictionMarket
        ? [calculateProbability(px, orderBlock === OrderBlockE.Short), perpetualStatistics.quoteCurrency]
        : [px, perpetualStatistics.quoteCurrency];
    }
    return [undefined, undefined];
  }, [perpetualStatistics, perpetualStaticInfo, orderBlock]);

  const midPrice: StatDataI = useMemo(
    () => ({
      id: 'midPrice',
      label: t('pages.trade.stats.mid-price'),
      tooltip: t('pages.trade.stats.mid-price-tooltip'),
      value: displayCcy ? formatToCurrency(displayMidPrice, displayCcy, true) : '--',
      numberOnly: displayCcy ? formatToCurrency(displayMidPrice, '', true, undefined, true) : '--',
      className: midPriceClass, // Add the custom class here
    }),
    [t, midPriceClass, displayMidPrice, displayCcy]
  );

  const isPredictionMarket = useMemo(() => {
    if (!selectedPerpetual || !selectedPool) {
      return false;
    }
    try {
      return traderAPI?.isPredictionMarket(
        createSymbol({
          poolSymbol: selectedPool.poolSymbol,
          baseCurrency: selectedPerpetual.baseCurrency,
          quoteCurrency: selectedPerpetual.quoteCurrency,
        })
      );
    } catch (error) {
      // skip
    }
    return false;
  }, [traderAPI, selectedPerpetual, selectedPool]);

  const currencyMarketData = useMemo(() => {
    if (selectedPerpetual && markets.length > 0) {
      return markets.find((market) => market.value === `${selectedPerpetual.id}`)?.item.marketData ?? null;
    }
    return null;
  }, [selectedPerpetual, markets]);

  return (
    <div className={styles.holderRoot} onClick={() => setMarketSelectModalOpen(true)}>
      <div className={classnames(styles.iconsWrapper, { [styles.oneCurrency]: isPredictionMarket })}>
        <div className={styles.baseIcon}>
          <DynamicLogo logoName={selectedPerpetual?.baseCurrency.toLowerCase() || ''} width={60} height={60} />
        </div>
        <div className={styles.quoteIcon}>
          <DynamicLogo logoName={selectedPerpetual?.quoteCurrency.toLowerCase() ?? ''} width={60} height={60} />
        </div>
      </div>
      <Button className={styles.marketSelectButton} variant="outlined">
        <div className={styles.selectedMarketBlock}>
          <div className={styles.selectedMarketValue}>
            <Typography variant="bodyBig" className={styles.selectedMarketPerpetual}>
              {isPredictionMarket
                ? cutBaseCurrency(selectedPerpetual?.baseCurrency)
                : `${cutBaseCurrency(selectedPerpetual?.baseCurrency)}/${selectedPerpetual?.quoteCurrency}`}
            </Typography>
            <CurrencyBadge
              className={styles.badge}
              assetType={currencyMarketData?.assetType}
              label={t(`common.select.market.${currencyMarketData?.assetType}`)}
              withPoint={true}
            />
          </div>
          <div className={styles.midPrice}>
            {midPrice.tooltip && perpetualStatistics?.midPriceDiff ? (
              <TooltipMobile tooltip={midPrice.tooltip}>
                <div className={classnames(styles.statMainValue, midPrice.className)}>{midPrice.numberOnly}</div>
              </TooltipMobile>
            ) : (
              <div className={classnames(styles.statMainValue, midPrice.className)}>{midPrice.numberOnly}</div>
            )}
            {!isPredictionMarket && currencyMarketData && (
              <div
                className={classnames(styles.priceChange, {
                  [styles.positive]: currencyMarketData.ret24hPerc >= 0,
                  [styles.negative]: currencyMarketData.ret24hPerc < 0,
                })}
              >
                <span>{currencyMarketData.ret24hPerc.toFixed(2)}%</span>
                <span>{currencyMarketData.ret24hPerc >= 0 ? <ArrowDropUp /> : <ArrowDropDown />}</span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.arrowDropDown}>
          {isMarketSelectModalOpen ? <ArrowUpIcon width={20} height={20} /> : <ArrowDownIcon width={20} height={20} />}
        </div>
      </Button>
    </div>
  );
});

import { MenuItem, useMediaQuery, useTheme } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { AttachMoneyOutlined } from '@mui/icons-material';
import { useWebSocketContext } from 'context/websocket-context/d8x/useWebSocketContext';
import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { clearInputsDataAtom } from 'store/order-block.store';
import { poolsAtom, selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { tokensIconsMap } from 'utils/tokens';

import { HeaderSelect } from '../header-select/HeaderSelect';
import type { SelectItemI } from '../header-select/types';

import styles from './MarketSelect.module.scss';
import { collateralFilterAtom, collateralsAtom } from './collaterals.store';
import { SearchInput } from './components/SearchInput/SearchInput';
import { Select } from './components/Select';
import { Tabs } from './components/Tabs/Tabs';
import { PerpetualWithPoolI } from './types';
import { useMarketsFilter } from './useMarketsFilter';

// const CollateralOption = ({ collateral }: { collateral: string }) => {
//   const IconComponent = tokensIconsMap[collateral.toLowerCase()]?.icon ?? tokensIconsMap.default.icon;

//   return (
//     <MenuItem className={styles.collateralOptionContainer} value={collateral}>
//       <IconComponent width={24} height={24} />
//       {collateral}
//     </MenuItem>
//   );
// };

// const SelectedCollateral = ({ collateral }: { collateral?: string }) => {
//   return (
//     <div className={styles.collateralContainer}>
//       Collateral:
//       <div>{collateral}</div>
//     </div>
//   );
// };

const OptionsHeader = () => {
  const { t } = useTranslation();
  const setCollateralFilter = useSetAtom(collateralFilterAtom);
  const [collaterals] = useAtom(collateralsAtom);

  return (
    <>
      <div className={styles.optionsHeader}>
        <div className={styles.header}>{t('common.select.market.header')}</div>
      </div>
      <div className={styles.controlsContainer}>
        <SearchInput />
        <Select options={collaterals} onSelect={(v) => setCollateralFilter(v)} />
        {/* <MaterialSelect
          sx={{ width: '100%' }}
          className={styles.collateralSelect}
          value={collaterals[0]}
          onChange={() => {
            console.log('onChange');
          }}
          renderValue={(valueForLabel) => <SelectedCollateral collateral={valueForLabel} />}
        >
          {collaterals.map((collateral) => (
            <CollateralOption key={collateral} collateral={collateral} />
          ))}
        </MaterialSelect> */}
        <Tabs />
      </div>
    </>
  );
};

const SelectedValue = ({ value, collateral }: { value: string; collateral?: string }) => {
  return (
    <div className={styles.selectedValueContainer}>
      <div>{value}</div>
      <div className={styles.collateral}>{collateral}</div>
    </div>
  );
};

const Option = ({
  option,
  selectedPerpetual,
}: {
  option: SelectItemI<PerpetualWithPoolI>;
  selectedPerpetual?: number;
}) => {
  // console.log('option :>> ', option);
  const IconComponent = tokensIconsMap[option.item.baseCurrency.toLowerCase()]?.icon ?? tokensIconsMap.default.icon;
  return (
    <MenuItem
      value={option.value}
      selected={option.value === selectedPerpetual?.toString()}
      onKeyDown={(e) => e.stopPropagation()}
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

export const MarketSelect = memo(() => {
  const { address } = useAccount();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { isConnected, send } = useWebSocketContext();

  const [pools] = useAtom(poolsAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  // console.log('pools :>> ', pools, selectedPool);
  const [selectedPerpetual, setSelectedPerpetual] = useAtom(selectedPerpetualAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);

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
    if (selectedPool && isConnected) {
      send(JSON.stringify({ type: 'unsubscribe' }));
      selectedPool.perpetuals.forEach(({ baseCurrency, quoteCurrency }) => {
        const symbol = createSymbol({
          baseCurrency,
          quoteCurrency,
          poolSymbol: selectedPool.poolSymbol,
        });
        send(
          JSON.stringify({
            traderAddr: address ?? '',
            symbol,
          })
        );
      });
    }
  }, [selectedPool, isConnected, send, address]);

  const handleChange = (newItem: PerpetualWithPoolI) => {
    console.log('newItem :>> ', newItem);
    setSelectedPool(newItem.poolSymbol);
    setSelectedPerpetual(newItem.id);

    navigate(
      `${location.pathname}${location.search}#${newItem.baseCurrency}-${newItem.quoteCurrency}-${newItem.poolSymbol}`
    );
    clearInputsData();
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
      <HeaderSelect<PerpetualWithPoolI>
        id="market-select"
        label={t('common.select.market.label')}
        native={isMobileScreen}
        items={filteredMarkets}
        width="100%"
        value={selectedPerpetual?.id.toString()}
        handleChange={handleChange}
        OptionsHeader={OptionsHeader}
        renderLabel={(value) => (
          <SelectedValue
            key={`${value.baseCurrency}/${value.quoteCurrency}`}
            collateral={selectedPool?.poolSymbol}
            value={`${value.baseCurrency}/${value.quoteCurrency}`}
          />
        )}
        renderOption={(option) =>
          isMobileScreen ? (
            <option key={option.value} value={option.value}>
              {option.item.baseCurrency}/{option.item.quoteCurrency}
            </option>
          ) : (
            <Option key={option.value} option={option} selectedPerpetual={selectedPerpetual?.id} />
          )
        }
      />
    </div>
  );
});

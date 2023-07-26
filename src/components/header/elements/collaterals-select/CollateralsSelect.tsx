import { useAtom } from 'jotai';
import { memo, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { Box, MenuItem, useMediaQuery, useTheme } from '@mui/material';

import { ReactComponent as CollateralIcon } from 'assets/icons/collateralIcon.svg';
import { useWebSocketContext } from 'context/websocket-context/d8x/useWebSocketContext';
import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { clearInputsDataAtom } from 'store/order-block.store';
import {
  poolsAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  selectedPoolIdAtom,
  traderAPIAtom,
} from 'store/pools.store';
import type { PoolI } from 'types/types';

import { HeaderSelect } from '../header-select/HeaderSelect';
import type { SelectItemI } from '../header-select/types';

import styles from '../header-select/HeaderSelect.module.scss';

const OptionsHeader = () => {
  return (
    <MenuItem className={styles.optionsHeader} disabled>
      <Box className={styles.leftLabel}>Collateral</Box>
      <Box className={styles.rightLabel}>No. of perps</Box>
    </MenuItem>
  );
};

interface CollateralsSelectPropsI {
  label?: string;
}

export const CollateralsSelect = memo(({ label }: CollateralsSelectPropsI) => {
  const { address } = useAccount();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();
  const location = useLocation();

  const { isConnected, send } = useWebSocketContext();

  const [pools] = useAtom(poolsAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [, setSelectedPoolId] = useAtom(selectedPoolIdAtom);
  const [, setSelectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [, clearInputsData] = useAtom(clearInputsDataAtom);
  const [traderAPI] = useAtom(traderAPIAtom);

  useEffect(() => {
    if (location.hash) {
      const symbolHash = location.hash.slice(1);
      const result = parseSymbol(symbolHash);
      if (result && selectedPool?.poolSymbol !== result.poolSymbol) {
        setSelectedPool(result.poolSymbol);
      }
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

  useEffect(() => {
    if (location.hash || !selectedPool) {
      return;
    }

    navigate(
      `${location.pathname}#${selectedPool.perpetuals[0].baseCurrency}-${selectedPool.perpetuals[0].quoteCurrency}-${selectedPool.poolSymbol}`
    );
  }, [selectedPool, location.hash, location.pathname, navigate]);

  const handleChange = (newItem: PoolI) => {
    setSelectedPool(newItem.poolSymbol);
    setSelectedPoolId(traderAPI?.getPoolIdFromSymbol(newItem.poolSymbol) ?? null);
    setSelectedPerpetual(newItem.perpetuals[0].id);
    navigate(
      `${location.pathname}#${newItem.perpetuals[0].baseCurrency}-${newItem.perpetuals[0].quoteCurrency}-${newItem.poolSymbol}`
    );
    clearInputsData();
  };

  const selectItems: SelectItemI<PoolI>[] = useMemo(() => {
    return pools.filter((pool) => pool.isRunning).map((pool) => ({ value: pool.poolSymbol, item: pool }));
  }, [pools]);

  return (
    <Box className={styles.holderRoot}>
      <Box className={styles.iconWrapper}>
        <CollateralIcon />
      </Box>
      <HeaderSelect<PoolI>
        id="collaterals-select"
        label={label ? label : 'Collateral'}
        native={isMobileScreen}
        items={selectItems}
        width="100%"
        value={selectedPool?.poolSymbol}
        handleChange={handleChange}
        OptionsHeader={OptionsHeader}
        renderLabel={(value) => value.poolSymbol}
        renderOption={(option) =>
          isMobileScreen ? (
            <option key={option.value} value={option.value}>
              {option.item.poolSymbol}
            </option>
          ) : (
            <MenuItem key={option.value} value={option.value} selected={option.value === selectedPool?.poolSymbol}>
              <Box className={styles.optionHolder}>
                <Box className={styles.label}>{option.item.poolSymbol}</Box>
                <Box className={styles.value}>{option.item.perpetuals.length}</Box>
              </Box>
            </MenuItem>
          )
        }
      />
    </Box>
  );
});

import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { AttachMoneyOutlined } from '@mui/icons-material';
import { Box, MenuItem, useMediaQuery, useTheme } from '@mui/material';

import { useWebSocketContext } from 'context/websocket-context/d8x/useWebSocketContext';
import { createSymbol } from 'helpers/createSymbol';
import { parseSymbol } from 'helpers/parseSymbol';
import { clearInputsDataAtom } from 'store/order-block.store';
import { poolsAtom, selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import type { PoolI } from 'types/types';

import { HeaderSelect } from '../header-select/HeaderSelect';
import type { SelectItemI } from '../header-select/types';

import styles from '../header-select/HeaderSelect.module.scss';

const OptionsHeader = () => {
  const { t } = useTranslation();

  return (
    <MenuItem className={styles.optionsHeader} disabled>
      <Box className={styles.leftLabel}>{t('common.select.collateral.headers.collateral')}</Box>
      <Box className={styles.rightLabel}>{t('common.select.collateral.headers.num-of-perps')}</Box>
    </MenuItem>
  );
};

interface CollateralsSelectPropsI {
  label?: string;
  withNavigate?: boolean;
}

export const CollateralsSelect = memo(({ label, withNavigate }: CollateralsSelectPropsI) => {
  const { address } = useAccount();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { isConnected, send } = useWebSocketContext();

  const [pools] = useAtom(poolsAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const setSelectedPerpetual = useSetAtom(selectedPerpetualAtom);
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

  const handleChange = (newItem: PoolI) => {
    setSelectedPool(newItem.poolSymbol);
    setSelectedPerpetual(newItem.perpetuals[0].id);

    if (withNavigate) {
      navigate(
        `${location.pathname}${location.search}#${newItem.perpetuals[0].baseCurrency}-${newItem.perpetuals[0].quoteCurrency}-${newItem.poolSymbol}`
      );
    }
    clearInputsData();
  };

  const selectItems: SelectItemI<PoolI>[] = useMemo(() => {
    return pools.filter((pool) => pool.isRunning).map((pool) => ({ value: pool.poolSymbol, item: pool }));
  }, [pools]);

  return (
    <Box className={styles.holderRoot}>
      <Box className={styles.iconWrapper}>
        <AttachMoneyOutlined />
      </Box>
      <HeaderSelect<PoolI>
        id="collaterals-select"
        label={label ? label : t('common.select.collateral.label')}
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

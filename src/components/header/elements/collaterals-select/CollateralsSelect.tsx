import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Box, MenuItem, useMediaQuery, useTheme } from '@mui/material';

import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { useWebSocketContext } from 'context/websocket-context/d8x/useWebSocketContext';
import { createSymbol } from 'helpers/createSymbol';
import { clearInputsDataAtom } from 'store/order-block.store';
import { flatTokenAtom, poolsAtom, selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
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

interface MenuOptionPropsI {
  pool: PoolI;
  userSymbol: string;
}

const MenuOption = ({ pool, userSymbol }: MenuOptionPropsI) => {
  return (
    <Box className={styles.optionHolder}>
      <Box className={styles.label}>
        <DynamicLogo logoName={userSymbol.toLowerCase()} width={16} height={16} />
        <span>{userSymbol}</span>
      </Box>
      <Box className={styles.value}>{pool.perpetuals.filter(({ state }) => state === 'NORMAL').length}</Box>
    </Box>
  );
};

export const CollateralsSelect = memo(() => {
  const { address } = useAccount();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { t } = useTranslation();

  const { isConnected, send } = useWebSocketContext();

  const pools = useAtomValue(poolsAtom);
  const flatToken = useAtomValue(flatTokenAtom);
  const setSelectedPerpetual = useSetAtom(selectedPerpetualAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);

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
            traderAddr: address ?? '0x0000000000000000000000000000000000000000',
            symbol,
          })
        );
      });
    }
  }, [selectedPool, isConnected, send, address]);

  const handleChange = (newItem: PoolI) => {
    setSelectedPool(newItem.poolSymbol);
    setSelectedPerpetual(newItem.perpetuals[0].id);

    clearInputsData();
  };

  const selectItems: SelectItemI<PoolI>[] = useMemo(() => {
    return pools.filter((pool) => pool.isRunning).map((pool) => ({ value: pool.poolSymbol, item: pool }));
  }, [pools]);

  const userSymbol =
    flatToken?.registeredSymbol ??
    (flatToken?.supportedTokens && flatToken?.supportedTokens.length > 0 ? flatToken?.supportedTokens[0].symbol : '');

  return (
    <Box className={styles.holderRoot}>
      <Box className={styles.iconsWrapper}>
        <DynamicLogo logoName={userSymbol.toLowerCase() ?? ''} width={52} height={52} />
      </Box>
      <HeaderSelect<PoolI>
        id="collaterals-select"
        label={t('common.select.collateral.label2')}
        native={isMobileScreen}
        items={selectItems}
        width="100%"
        value={selectedPool?.poolSymbol}
        handleChange={handleChange}
        OptionsHeader={OptionsHeader}
        renderLabel={(value) =>
          value.perpetuals.length > 0 && Math.floor(value.perpetuals[0].id / 100_000) === flatToken?.poolId
            ? userSymbol
            : value.settleSymbol
        }
        renderOption={(option) =>
          isMobileScreen ? (
            <option key={option.value} value={option.value} selected={option.value === selectedPool?.poolSymbol}>
              {Math.floor(option.item.perpetuals[0].id / 100_000) === flatToken?.poolId
                ? userSymbol
                : option.item.settleSymbol}
            </option>
          ) : (
            <MenuItem key={option.value} value={option.value} selected={option.value === selectedPool?.poolSymbol}>
              <MenuOption
                pool={option.item}
                userSymbol={
                  Math.floor(option.item.perpetuals[0].id / 100_000) === flatToken?.poolId
                    ? userSymbol
                    : option.item.settleSymbol
                }
              />
            </MenuItem>
          )
        }
      />
    </Box>
  );
});

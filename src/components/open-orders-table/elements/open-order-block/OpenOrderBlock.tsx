import { format } from 'date-fns';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { priceToProb } from '@d8x/perpetuals-sdk';

import { DeleteForeverOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

import { SidesRow } from 'components/sides-row/SidesRow';
import { parseSymbol } from 'helpers/parseSymbol';
import { collateralToSettleConversionAtom, traderAPIAtom } from 'store/pools.store';
import type { OrderWithIdI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { typeToLabelMap } from '../../typeToLabelMap';

import styles from './OpenOrderBlock.module.scss';

interface OpenOrderBlockPropsI {
  headers: TableHeaderI<OrderWithIdI>[];
  order: OrderWithIdI;
  handleOrderCancel: (order: OrderWithIdI) => void;
}

export const OpenOrderBlock = ({ headers, order, handleOrderCancel }: OpenOrderBlockPropsI) => {
  const { t } = useTranslation();

  const c2s = useAtomValue(collateralToSettleConversionAtom);

  const parsedSymbol = parseSymbol(order.symbol);
  const deadlineDate = order.deadline ? format(new Date(order.deadline * 1000), 'yyyy-MM-dd') : '';
  const leverage = order.leverage === undefined ? order.leverage : Math.round(100 * order.leverage) / 100;
  const collToSettleInfo = parsedSymbol?.poolSymbol ? c2s.get(parsedSymbol.poolSymbol) : undefined;
  const traderAPI = useAtomValue(traderAPIAtom);

  const [displayLimitPrice, displayTriggerPrice] = useMemo(() => {
    if (!!order.limitPrice && !!order.limitPrice) {
      try {
        return traderAPI?.isPredictionMarket(order.symbol)
          ? [priceToProb(order.limitPrice), priceToProb(order.limitPrice)]
          : [order.limitPrice, order.stopPrice];
      } catch (error) {
        // skip
      }
    }
    return [order.limitPrice, order.stopPrice];
  }, [order, traderAPI]);

  return (
    <Box className={styles.root}>
      <Box className={styles.headerWrapper}>
        <Box className={styles.leftSection}>
          <Typography variant="bodySmall" component="p">
            {t('pages.trade.orders-table.order-block-mobile.symbol')}
          </Typography>
          <Typography variant="bodySmall" component="p" className={styles.symbol}>
            {`${parsedSymbol?.baseCurrency}/${parsedSymbol?.quoteCurrency}/${collToSettleInfo?.settleSymbol ?? ''}`}
          </Typography>
        </Box>
        <IconButton
          aria-label={t('pages.trade.orders-table.table-content.cancel')}
          title={t('pages.trade.positions-table.modify-modal.cancel')}
          onClick={() => handleOrderCancel(order)}
        >
          <DeleteForeverOutlined className={styles.actionIcon} />
        </IconButton>
      </Box>
      <Box className={styles.dataWrapper}>
        <SidesRow
          leftSide={headers[1].label}
          leftSideTooltip={headers[1].tooltip}
          rightSide={!!order.side && t(`pages.trade.orders-table.table-content.${order.side.toLowerCase()}`)}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[2].label}
          leftSideTooltip={headers[2].tooltip}
          rightSide={
            !!typeToLabelMap[order.type] &&
            t(`pages.trade.orders-table.table-content.${typeToLabelMap[order.type].toLowerCase()}`)
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[3].label}
          leftSideTooltip={headers[3].tooltip}
          rightSide={formatToCurrency(order.quantity, parsedSymbol?.baseCurrency)}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[4].label}
          leftSideTooltip={headers[4].tooltip}
          rightSide={
            displayLimitPrice && displayLimitPrice < Infinity
              ? formatToCurrency(displayLimitPrice, parsedSymbol?.quoteCurrency, true)
              : t('pages.trade.orders-table.table-content.na')
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[5].label}
          leftSideTooltip={headers[5].tooltip}
          rightSide={
            displayTriggerPrice
              ? formatToCurrency(displayTriggerPrice, parsedSymbol?.quoteCurrency, true)
              : t('pages.trade.orders-table.table-content.na')
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[6].label}
          leftSideTooltip={headers[6].tooltip}
          rightSide={
            order.reduceOnly
              ? t('pages.trade.orders-table.table-content.yes')
              : t('pages.trade.orders-table.table-content.no')
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[7].label}
          leftSideTooltip={headers[7].tooltip}
          rightSide={`${leverage}x`}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[8].label}
          leftSideTooltip={headers[8].tooltip}
          rightSide={deadlineDate}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
      </Box>
    </Box>
  );
};

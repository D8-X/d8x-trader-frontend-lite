import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteForeverOutlined, ModeEditOutlineOutlined } from '@mui/icons-material';
import { TableCell, TableRow, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { parseSymbol } from 'helpers/parseSymbol';
import { OpenOrderTypeE, OrderSideE } from 'types/enums';
import type { MarginAccountWithLiqPriceI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './PositionRow.module.scss';

interface PositionRowPropsI {
  position: MarginAccountWithLiqPriceI;
  handlePositionClose: (position: MarginAccountWithLiqPriceI) => void;
  handlePositionModify: (position: MarginAccountWithLiqPriceI) => void;
  handleTpSlModify: (position: MarginAccountWithLiqPriceI) => void;
}

interface OpenOrdersDataI {
  takeProfit: {
    className: string;
    value: string;
  };
  stopLoss: {
    className: string;
    value: string;
  };
}

const defaultOpenOrdersData: OpenOrdersDataI = {
  takeProfit: {
    className: '',
    value: '---',
  },
  stopLoss: {
    className: '',
    value: '---',
  },
};

export const PositionRow = memo(
  ({ position, handlePositionClose, handlePositionModify, handleTpSlModify }: PositionRowPropsI) => {
    const { t } = useTranslation();

    const parsedSymbol = parseSymbol(position.symbol);

    const openOrdersData: OpenOrdersDataI = useMemo(() => {
      const ordersData = {
        takeProfit: {
          ...defaultOpenOrdersData.takeProfit,
        },
        stopLoss: {
          ...defaultOpenOrdersData.stopLoss,
        },
      };

      if (position.openOrders.length === 0) {
        // If no open SL orders (TP orders) exist, the TP/SL column displays "---" for the SL price (TP price)
        return ordersData;
      }
      console.log('position.openOrders', position.openOrders);
      const takeProfitOrders = position.openOrders.filter((openOrder) => openOrder.type === OpenOrderTypeE.Limit);
      console.log('takeProfitOrders', takeProfitOrders);

      if (takeProfitOrders.length > 0) {
        ordersData.takeProfit.className = styles.tpValue;
        if (takeProfitOrders.length > 1) {
          // if >1 TP orders exist for the same position, display the string "multiple" for the TP price
          ordersData.takeProfit.value = t('pages.trade.positions-table.table-content.multiple');
        } else if (takeProfitOrders[0].quantity < position.positionNotionalBaseCCY) {
          // if 1 TP order exists for an order size that is < position.size, the TP/SL column displays "partial" for the TP price
          ordersData.takeProfit.value = t('pages.trade.positions-table.table-content.partial');
        } else {
          // if 1 SL order exists for an order size that is >= position.size, show limitPrice of that order for TP
          ordersData.takeProfit.value = formatToCurrency(
            takeProfitOrders[0].limitPrice,
            parsedSymbol?.quoteCurrency,
            true
          );
        }
      }

      const stopLossOrders = position.openOrders.filter(
        (openOrder) =>
          openOrder.type === OpenOrderTypeE.StopLimit &&
          ((openOrder.side === OrderSideE.Sell &&
            openOrder.limitPrice !== undefined &&
            openOrder.limitPrice === 0 &&
            openOrder.stopPrice &&
            openOrder.stopPrice <= position.entryPrice) ||
            (openOrder.side === OrderSideE.Buy &&
              openOrder.limitPrice !== undefined &&
              openOrder.limitPrice === Number.POSITIVE_INFINITY &&
              openOrder.stopPrice &&
              openOrder.stopPrice >= position.entryPrice))
      );
      console.log('stopLossOrders', stopLossOrders);
      if (stopLossOrders.length > 0) {
        ordersData.stopLoss.className = styles.slValue;
        if (stopLossOrders.length > 1) {
          // if >1 SL orders exist for the same position, display the string "multiple" for the SL price
          ordersData.stopLoss.value = t('pages.trade.positions-table.table-content.multiple');
        } else if (stopLossOrders[0].quantity < position.positionNotionalBaseCCY) {
          // if 1 SL order exists for an order size that is < position.size, the TP/SL column displays "partial" for the SL price
          ordersData.stopLoss.value = t('pages.trade.positions-table.table-content.partial');
        } else {
          // if 1 TP order exists for an order size that is >= position.size, show stopPrice of that order for SL
          ordersData.stopLoss.value = formatToCurrency(stopLossOrders[0].stopPrice, parsedSymbol?.quoteCurrency, true);
        }
      }

      return ordersData;
    }, [t, position, parsedSymbol]);

    return (
      <TableRow key={position.symbol}>
        <TableCell align="left">
          <Typography variant="cellSmall">
            {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}/{parsedSymbol?.poolSymbol}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="cellSmall">
            {formatToCurrency(position.positionNotionalBaseCCY, parsedSymbol?.baseCurrency, true)}
          </Typography>
        </TableCell>
        <TableCell align="left">
          <Typography variant="cellSmall">
            {position.side === 'BUY'
              ? t('pages.trade.positions-table.table-content.buy')
              : t('pages.trade.positions-table.table-content.sell')}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="cellSmall">
            {formatToCurrency(position.entryPrice, parsedSymbol?.quoteCurrency, true)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="cellSmall">
            {position.liqPrice < 0
              ? `- ${parsedSymbol?.quoteCurrency}`
              : formatToCurrency(position.liqPrice, parsedSymbol?.quoteCurrency, true)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="cellSmall">
            {formatToCurrency(position.collateralCC, parsedSymbol?.poolSymbol, true)} (
            {Math.round(position.leverage * 100) / 100}x)
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography
            variant="cellSmall"
            className={position.unrealizedPnlQuoteCCY > 0 ? styles.pnlPositive : styles.pnlNegative}
          >
            {formatToCurrency(position.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency, true)}
          </Typography>
        </TableCell>
        <TableCell align="right" className={styles.tpSlCell}>
          <div>
            <IconButton
              aria-label={t('pages.trade.positions-table.table-content.modify')}
              title={t('pages.trade.positions-table.table-content.modify')}
              onClick={() => handleTpSlModify(position)}
            >
              <ModeEditOutlineOutlined className={styles.actionIcon} />
            </IconButton>
          </div>
          <div>
            <Typography variant="cellSmall" component="div" className={openOrdersData.takeProfit.className}>
              {openOrdersData.takeProfit.value}
            </Typography>
            <Typography variant="cellSmall" component="div" className={openOrdersData.stopLoss.className}>
              {openOrdersData.stopLoss.value}
            </Typography>
          </div>
        </TableCell>
        <TableCell align="center">
          <IconButton
            aria-label={t('pages.trade.positions-table.table-content.modify')}
            title={t('pages.trade.positions-table.table-content.modify')}
            onClick={() => handlePositionModify(position)}
          >
            <ModeEditOutlineOutlined className={styles.actionIcon} />
          </IconButton>
          <IconButton
            aria-label={t('pages.trade.positions-table.table-content.close')}
            title={t('pages.trade.positions-table.modify-modal.close')}
            onClick={() => handlePositionClose(position)}
          >
            <DeleteForeverOutlined className={styles.actionIcon} />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
);

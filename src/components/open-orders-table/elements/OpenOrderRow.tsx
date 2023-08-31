import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import IconButton from '@mui/material/IconButton';
import { DeleteForeverOutlined } from '@mui/icons-material';
import { TableCell, TableRow, Typography } from '@mui/material';

import { parseSymbol } from 'helpers/parseSymbol';
import type { OrderWithIdI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { typeToLabelMap } from '../typeToLabelMap';
import styles from './OpenOrderRow.module.scss';

interface OpenOrderRowPropsI {
  order: OrderWithIdI;
  handleOrderCancel: (order: OrderWithIdI) => void;
}

export const OpenOrderRow = ({ order, handleOrderCancel }: OpenOrderRowPropsI) => {
  const { t } = useTranslation();
  const parsedSymbol = parseSymbol(order.symbol);
  const deadlineDate = order.deadline ? format(new Date(order.deadline * 1000), 'yyyy-MM-dd') : '';
  const leverage = order.leverage === undefined ? order.leverage : Math.round(100 * order.leverage) / 100;

  return (
    <TableRow>
      <TableCell align="left">
        <Typography variant="cellSmall">
          {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}/{parsedSymbol?.poolSymbol}
        </Typography>
      </TableCell>
      <TableCell align="left">
        <Typography variant="cellSmall">
          {!!order.side && t(`pages.trade.orders-table.table-content.${order.side.toLowerCase()}`)}
        </Typography>
      </TableCell>
      <TableCell align="left">
        <Typography variant="cellSmall">
          {!!typeToLabelMap[order.type] &&
            t(`pages.trade.orders-table.table-content.${typeToLabelMap[order.type].toLowerCase()}`)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {formatToCurrency(order.quantity, parsedSymbol?.baseCurrency, true)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {order.limitPrice && order.limitPrice < Infinity
            ? formatToCurrency(order.limitPrice, parsedSymbol?.quoteCurrency, true)
            : t('pages.trade.orders-table.table-content.na')}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {order.stopPrice
            ? formatToCurrency(order.stopPrice, parsedSymbol?.quoteCurrency, true)
            : t('pages.trade.orders-table.table-content.na')}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">{leverage}x</Typography>
      </TableCell>
      <TableCell align="left">
        <Typography variant="cellSmall">{deadlineDate}</Typography>
      </TableCell>
      <TableCell align="center">
        <IconButton
          aria-label={t('pages.trade.orders-table.table-content.cancel')}
          title={t('pages.trade.positions-table.modify-modal.cancel')}
          onClick={() => handleOrderCancel(order)}
        >
          <DeleteForeverOutlined className={styles.actionIcon} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

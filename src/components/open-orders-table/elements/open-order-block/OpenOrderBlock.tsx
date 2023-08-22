import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import IconButton from '@mui/material/IconButton';
import { DeleteForeverOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import { SidesRow } from 'components/sides-row/SidesRow';
import { parseSymbol } from 'helpers/parseSymbol';
import type { OrderWithIdI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { typeToLabelMap } from '../../typeToLabelMap';

import styles from './OpenOrderBlock.module.scss';

interface OpenOrderBlockPropsI {
  headers: TableHeaderI[];
  order: OrderWithIdI;
  handleOrderCancel: (order: OrderWithIdI) => void;
}

export const OpenOrderBlock = ({ headers, order, handleOrderCancel }: OpenOrderBlockPropsI) => {
  const { t } = useTranslation();
  const parsedSymbol = parseSymbol(order.symbol);
  const deadlineDate = order.deadline ? format(new Date(order.deadline * 1000), 'yyyy-MM-dd') : '';
  const leverage = order.leverage === undefined ? order.leverage : Math.round(100 * order.leverage) / 100;

  return (
    <Box className={styles.root}>
      <Box className={styles.headerWrapper}>
        <Box className={styles.leftSection}>
          <Typography variant="bodySmall" component="p">
            {t('pages.trade.orders-table.order-block-mobile.symbol')}
          </Typography>
          <Typography variant="bodySmall" component="p" className={styles.symbol}>
            {`${parsedSymbol?.baseCurrency}/${parsedSymbol?.quoteCurrency}`}
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
          rightSide={!!order.side && t(`pages.trade.orders-table.table-content.${order.side.toLowerCase()}`)}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[2].label}
          rightSide={
            !!typeToLabelMap[order.type] &&
            t(`pages.trade.orders-table.table-content.${typeToLabelMap[order.type].toLowerCase()}`)
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[3].label}
          rightSide={formatToCurrency(order.quantity, parsedSymbol?.baseCurrency)}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[4].label}
          rightSide={
            order.limitPrice && order.limitPrice < Infinity
              ? formatToCurrency(order.limitPrice, parsedSymbol?.quoteCurrency, true)
              : t('pages.trade.orders-table.table-content.na')
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[5].label}
          rightSide={
            order.stopPrice
              ? formatToCurrency(order.stopPrice, parsedSymbol?.quoteCurrency, true)
              : t('pages.trade.orders-table.table-content.na')
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[6].label}
          rightSide={`${leverage}x`}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[7].label}
          rightSide={deadlineDate}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
      </Box>
    </Box>
  );
};

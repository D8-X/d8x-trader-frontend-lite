import { format } from 'date-fns';

import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

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
  const deadlineDate = order.deadline ? format(new Date(order.deadline * 1000), 'MMM dd yyyy') : '';
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
        <Button variant="primary" size="tableSmall" onClick={() => handleOrderCancel(order)}>
          {t('pages.trade.orders-table.order-block-mobile.cancel')}
        </Button>
      </Box>
      <Box className={styles.dataWrapper}>
        <SidesRow
          leftSide={headers[1].label}
          rightSide={order.side}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[2].label}
          rightSide={typeToLabelMap[order.type]}
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
          rightSide={order.limitPrice ? formatToCurrency(order.limitPrice, parsedSymbol?.quoteCurrency) : 'N/A'}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[5].label}
          rightSide={order.stopPrice ? formatToCurrency(order.stopPrice, parsedSymbol?.quoteCurrency) : 'N/A'}
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

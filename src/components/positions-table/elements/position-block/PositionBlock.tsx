import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { SidesRow } from 'components/sides-row/SidesRow';
import { parseSymbol } from 'helpers/parseSymbol';
import type { MarginAccountI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './PositionBlock.module.scss';

interface PositionRowPropsI {
  headers: TableHeaderI[];
  position: MarginAccountI;
  handlePositionModify: (position: MarginAccountI) => void;
}

export const PositionBlock = ({ headers, position, handlePositionModify }: PositionRowPropsI) => {
  const { t } = useTranslation();
  const parsedSymbol = parseSymbol(position.symbol);

  return (
    <Box className={styles.root}>
      <Box className={styles.headerWrapper}>
        <Box className={styles.leftSection}>
          <Typography variant="bodySmall" component="p">
            {t('pages.trade.positions-table.position-block-mobile.symbol')}
          </Typography>
          <Typography variant="bodySmall" component="p" className={styles.symbol}>
            {`${parsedSymbol?.baseCurrency}/${parsedSymbol?.quoteCurrency}`}
          </Typography>
        </Box>
        <Button variant="primary" size="tableSmall" onClick={() => handlePositionModify(position)}>
          {t('pages.trade.positions-table.position-block-mobile.modify')}
        </Button>
      </Box>
      <Box className={styles.dataWrapper}>
        <SidesRow
          leftSide={headers[2].label}
          rightSide={position.side}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[1].label}
          rightSide={formatToCurrency(position.positionNotionalBaseCCY, parsedSymbol?.baseCurrency)}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[3].label}
          rightSide={formatToCurrency(position.entryPrice, parsedSymbol?.quoteCurrency)}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[4].label}
          rightSide={
            position.liquidationPrice[0] < 0
              ? `- ${parsedSymbol?.quoteCurrency}`
              : formatToCurrency(position.liquidationPrice[0], parsedSymbol?.quoteCurrency)
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[5].label}
          rightSide={`${formatToCurrency(position.collateralCC, '')}(${Math.round(position.leverage * 100) / 100}x)`}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[6].label}
          rightSide={formatToCurrency(position.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency)}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
      </Box>
    </Box>
  );
};

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteForeverOutlined, ModeEditOutlineOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { SidesRow } from 'components/sides-row/SidesRow';
import { parseSymbol } from 'helpers/parseSymbol';
import type { MarginAccountI, MarginAccountWithLiqPriceI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './PositionBlock.module.scss';

interface PositionRowPropsI {
  headers: TableHeaderI<MarginAccountWithLiqPriceI>[];
  position: MarginAccountWithLiqPriceI;
  handlePositionClose: (position: MarginAccountI) => void;
  handlePositionModify: (position: MarginAccountI) => void;
}

export const PositionBlock = memo(
  ({ headers, position, handlePositionClose, handlePositionModify }: PositionRowPropsI) => {
    const { t } = useTranslation();

    const parsedSymbol = parseSymbol(position.symbol);
    const pnlColor = position.unrealizedPnlQuoteCCY > 0 ? styles.green : styles.red;

    return (
      <Box className={styles.root}>
        <Box className={styles.headerWrapper}>
          <Box className={styles.leftSection}>
            <Typography variant="bodySmall" component="p">
              {t('pages.trade.positions-table.position-block-mobile.symbol')}
            </Typography>
            <Typography variant="bodySmall" component="p" className={styles.symbol}>
              {`${parsedSymbol?.baseCurrency}/${parsedSymbol?.quoteCurrency}/${parsedSymbol?.poolSymbol}`}
            </Typography>
          </Box>
          <IconButton
            aria-label={t('pages.trade.positions-table.table-content.modify')}
            title={t('pages.trade.positions-table.table-content.modify')}
            onClick={() => handlePositionModify(position)}
          >
            <ModeEditOutlineOutlined className={styles.actionIcon} />
          </IconButton>
          <IconButton
            aria-label={t('pages.trade.positions-table.table-content.modify')}
            title={t('pages.trade.positions-table.modify-modal.close')}
            onClick={() => handlePositionClose(position)}
          >
            <DeleteForeverOutlined className={styles.actionIcon} />
          </IconButton>
        </Box>
        <Box className={styles.dataWrapper}>
          <SidesRow
            leftSide={headers[2].label}
            rightSide={
              position.side === 'BUY'
                ? t('pages.trade.positions-table.table-content.buy')
                : t('pages.trade.positions-table.table-content.sell')
            }
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[1].label}
            rightSide={formatToCurrency(position.positionNotionalBaseCCY, parsedSymbol?.baseCurrency, true)}
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[3].label}
            rightSide={formatToCurrency(position.entryPrice, parsedSymbol?.quoteCurrency, true)}
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[4].label}
            rightSide={
              position.liqPrice < 0
                ? `- ${parsedSymbol?.quoteCurrency}`
                : formatToCurrency(position.liqPrice, parsedSymbol?.quoteCurrency, true)
            }
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[5].label}
            rightSide={`${formatToCurrency(position.collateralCC, parsedSymbol?.poolSymbol, true)}${' '}(${
              Math.round(position.leverage * 100) / 100
            }x)`}
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[6].label}
            rightSide={formatToCurrency(position.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency, true)}
            leftSideStyles={styles.dataLabel}
            rightSideStyles={pnlColor}
          />
        </Box>
      </Box>
    );
  }
);

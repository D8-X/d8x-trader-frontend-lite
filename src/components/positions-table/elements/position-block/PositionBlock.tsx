import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { priceToProb } from '@d8x/perpetuals-sdk';

import { DeleteForeverOutlined, ModeEditOutlineOutlined, ShareOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

import { SidesRow } from 'components/sides-row/SidesRow';
import { parseSymbol } from 'helpers/parseSymbol';
import { collateralToSettleConversionAtom, traderAPIAtom } from 'store/pools.store';
import type { MarginAccountWithAdditionalDataI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { TpSlValue } from '../tp-sl-value/TpSlValue';

import styles from './PositionBlock.module.scss';

interface PositionRowPropsI {
  headers: TableHeaderI<MarginAccountWithAdditionalDataI>[];
  position: MarginAccountWithAdditionalDataI;
  handlePositionClose: (position: MarginAccountWithAdditionalDataI) => void;
  handlePositionModify: (position: MarginAccountWithAdditionalDataI) => void;
  handlePositionShare: (position: MarginAccountWithAdditionalDataI) => void;
  handleTpSlModify: (position: MarginAccountWithAdditionalDataI) => void;
}

export const PositionBlock = memo(
  ({
    headers,
    position,
    handlePositionClose,
    handlePositionModify,
    handlePositionShare,
    handleTpSlModify,
  }: PositionRowPropsI) => {
    const { t } = useTranslation();

    const c2s = useAtomValue(collateralToSettleConversionAtom);

    const parsedSymbol = parseSymbol(position.symbol);
    const pnlColor = position.unrealizedPnlQuoteCCY >= 0 ? styles.green : styles.red;
    const collToSettleInfo = parsedSymbol?.poolSymbol ? c2s.get(parsedSymbol.poolSymbol) : undefined;
    const traderAPI = useAtomValue(traderAPIAtom);

    const [displayEntryPrice, displayLiqPrice, displayCcy] = useMemo(() => {
      if (!!traderAPI && !!parsedSymbol) {
        try {
          return traderAPI?.isPredictionMarket(position.symbol)
            ? [priceToProb(position.entryPrice), priceToProb(position.liqPrice), parsedSymbol.quoteCurrency]
            : [position.entryPrice, position.liqPrice, parsedSymbol.quoteCurrency];
        } catch (error) {
          // skip
        }
      }
      return [position.entryPrice, position.liqPrice, parsedSymbol?.quoteCurrency];
    }, [position, parsedSymbol, traderAPI]);

    return (
      <Box className={styles.root}>
        <Box className={styles.headerWrapper}>
          <Box className={styles.leftSection}>
            <Typography variant="bodySmall" component="p" color={'var(--d8x-color-text-main)'}>
              {t('pages.trade.positions-table.position-block-mobile.symbol')}
            </Typography>
            <Typography variant="bodySmall" component="p" className={styles.symbol}>
              {`${parsedSymbol?.baseCurrency}/${parsedSymbol?.quoteCurrency}/${collToSettleInfo?.settleSymbol ?? ''}`}
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
          <IconButton
            aria-label={t('pages.trade.positions-table.table-content.share')}
            title={t('pages.trade.positions-table.modify-modal.share')}
            onClick={() => handlePositionShare(position)}
          >
            <ShareOutlined className={styles.actionIcon} />
          </IconButton>
        </Box>
        <Box className={styles.dataWrapper}>
          <SidesRow
            leftSide={headers[2].label}
            leftSideTooltip={headers[2].tooltip}
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
            leftSideTooltip={headers[1].tooltip}
            rightSide={formatToCurrency(position.positionNotionalBaseCCY, parsedSymbol?.baseCurrency, true)}
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[3].label}
            leftSideTooltip={headers[3].tooltip}
            rightSide={formatToCurrency(displayEntryPrice, displayCcy, true)}
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[4].label}
            leftSideTooltip={headers[4].tooltip}
            rightSide={
              position.liqPrice < 0
                ? `- ${parsedSymbol?.quoteCurrency}`
                : formatToCurrency(displayLiqPrice, displayCcy, true)
            }
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[5].label}
            leftSideTooltip={headers[5].tooltip}
            rightSide={`${
              collToSettleInfo
                ? formatToCurrency(position.collateralCC * collToSettleInfo.value, collToSettleInfo.settleSymbol, true)
                : '-'
            } (${Math.round(position.leverage * 100) / 100}x)`}
            leftSideStyles={styles.dataLabel}
            rightSideStyles={styles.dataValue}
          />
          <SidesRow
            leftSide={headers[6].label}
            leftSideTooltip={headers[6].tooltip}
            rightSide={`${formatToCurrency(position.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency, true)} ${
              position.unrealizedPnlQuoteCCY
                ? `(${Math.round((position.unrealizedPnlQuoteCCY / (position.collateralCC * position.collToQuoteConversion)) * 10000) / 100}%)`
                : '(0%)'
            }`}
            leftSideStyles={styles.dataLabel}
            rightSideStyles={pnlColor}
          />
          <SidesRow
            leftSide={headers[7].label}
            leftSideTooltip={headers[7].tooltip}
            rightSide={<TpSlValue position={position} handleTpSlModify={handleTpSlModify} />}
          />
        </Box>
      </Box>
    );
  }
);

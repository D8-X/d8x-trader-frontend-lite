import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteForeverOutlined, ModeEditOutlineOutlined, ShareOutlined } from '@mui/icons-material';
import { Button, IconButton, TableCell, TableRow, Typography } from '@mui/material';

import { calculateProbability } from 'helpers/calculateProbability';
import { parseSymbol } from 'helpers/parseSymbol';
import { collateralToSettleConversionAtom, perpetualsAtom, traderAPIAtom } from 'store/pools.store';
import { OrderSideE } from 'types/enums';
import type { MarginAccountWithAdditionalDataI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { TpSlValue } from '../tp-sl-value/TpSlValue';

import styles from './PositionRow.module.scss';

interface PositionRowPropsI {
  position: MarginAccountWithAdditionalDataI;
  handlePositionClose: (position: MarginAccountWithAdditionalDataI) => void;
  handlePositionModify: (position: MarginAccountWithAdditionalDataI) => void;
  handlePositionShare: (position: MarginAccountWithAdditionalDataI) => void;
  handleTpSlModify: (position: MarginAccountWithAdditionalDataI) => void;
  handlePositionClaim: (position: MarginAccountWithAdditionalDataI) => void;
}

export const PositionRow = memo(
  ({
    position,
    handlePositionClose,
    handlePositionModify,
    handlePositionShare,
    handleTpSlModify,
    handlePositionClaim,
  }: PositionRowPropsI) => {
    const { t } = useTranslation();

    const c2s = useAtomValue(collateralToSettleConversionAtom);
    const traderAPI = useAtomValue(traderAPIAtom);
    const perpetuals = useAtomValue(perpetualsAtom);

    const parsedSymbol = parseSymbol(position.symbol);
    const collToSettleInfo = parsedSymbol?.poolSymbol ? c2s.get(parsedSymbol.poolSymbol) : undefined;
    const perpetualState = perpetuals.find(({ symbol }) => symbol === position.symbol);

    let isPredictionMarket: boolean | undefined;
    try {
      isPredictionMarket = traderAPI?.isPredictionMarket(position.symbol);
    } catch (error) {
      // skip
    }

    const [displayEntryPrice, displayLiqPrice, displayCcy] = useMemo(() => {
      return isPredictionMarket
        ? [
            calculateProbability(position.entryPrice, position.side === OrderSideE.Sell),
            calculateProbability(position.liqPrice, position.side === OrderSideE.Sell),
            parsedSymbol?.quoteCurrency,
          ]
        : [position.entryPrice, position.liqPrice, parsedSymbol?.quoteCurrency];
    }, [position, parsedSymbol, isPredictionMarket]);

    const isSettlementInProgress = useMemo(() => {
      return (
        ['SETTLE', 'CLEARED'].includes(perpetualState?.state || '') ||
        (isPredictionMarket && perpetualState?.state === 'EMERGENCY')
      );
    }, [isPredictionMarket, perpetualState]);

    return (
      <TableRow key={position.symbol}>
        <TableCell align="left">
          <Typography variant="cellSmall">
            {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}/{collToSettleInfo?.settleSymbol ?? ''}
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
          <Typography variant="cellSmall">{formatToCurrency(displayEntryPrice, displayCcy, true)}</Typography>
        </TableCell>
        {isSettlementInProgress ? (
          <>
            {perpetualState?.state !== 'CLEARED' && (
              <TableCell align="center" colSpan={4}>
                <Typography variant="cellSmall">Settlement in progress...</Typography>
              </TableCell>
            )}
            {perpetualState?.state === 'CLEARED' && (
              <TableCell align="center" colSpan={4}>
                <Button
                  onClick={() => handlePositionClaim(position)}
                  variant="secondary"
                  className={styles.actionButton}
                >
                  {t('pages.trade.positions-table.modify-modal.claim')}
                </Button>
              </TableCell>
            )}
          </>
        ) : (
          <>
            <TableCell align="right">
              <Typography variant="cellSmall">
                {position.liqPrice < 0
                  ? `- ${parsedSymbol?.quoteCurrency}`
                  : formatToCurrency(displayLiqPrice, displayCcy, true)}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="cellSmall">
                {collToSettleInfo
                  ? formatToCurrency(
                      position.collateralCC * collToSettleInfo.value,
                      collToSettleInfo.settleSymbol,
                      true
                    )
                  : '-'}{' '}
                ({Math.round(position.leverage * 100) / 100}x)
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography
                variant="cellSmall"
                className={position.unrealizedPnlQuoteCCY >= 0 ? styles.pnlPositive : styles.pnlNegative}
              >
                {formatToCurrency(position.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency, true)}
                {position.unrealizedPnlQuoteCCY
                  ? ` (${Math.round((position.unrealizedPnlQuoteCCY / (position.collateralCC * position.collToQuoteConversion)) * 10000) / 100}%)`
                  : ' (0%)'}
              </Typography>
            </TableCell>
            <TableCell align="right" className={styles.tpSlCell}>
              {!isPredictionMarket && <TpSlValue position={position} handleTpSlModify={handleTpSlModify} />}
              {isPredictionMarket && <Typography variant="cellSmall">-</Typography>}
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

              <IconButton
                aria-label={t('pages.trade.positions-table.table-content.share')}
                title={t('pages.trade.positions-table.modify-modal.share')}
                onClick={() => handlePositionShare(position)}
              >
                <ShareOutlined className={styles.actionIcon} />
              </IconButton>
            </TableCell>
          </>
        )}
      </TableRow>
    );
  }
);

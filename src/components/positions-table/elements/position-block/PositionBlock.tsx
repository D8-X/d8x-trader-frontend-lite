import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteForeverOutlined, ModeEditOutlineOutlined, ShareOutlined } from '@mui/icons-material';
import { Button, Box, IconButton, Typography } from '@mui/material';

import { SidesRow } from 'components/sides-row/SidesRow';
import { calculateProbability } from 'helpers/calculateProbability';
import { parseSymbol } from 'helpers/parseSymbol';
import { collateralToSettleConversionAtom, perpetualsAtom, traderAPIAtom } from 'store/pools.store';
import { OrderSideE } from 'types/enums';
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
  handlePositionClaim: (position: MarginAccountWithAdditionalDataI) => void;
}

export const PositionBlock = memo(
  ({
    headers,
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
    const pnlColor = position.unrealizedPnlQuoteCCY >= 0 ? styles.green : styles.red;
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
      <Box className={styles.root}>
        <Box className={styles.headerWrapper}>
          <Box className={styles.leftSection}>
            <Typography variant="fourteen" component="p" color={'var(--d8x-color-text-main)'}>
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
            disabled={isSettlementInProgress}
          >
            <ModeEditOutlineOutlined className={styles.actionIcon} />
          </IconButton>
          <IconButton
            aria-label={t('pages.trade.positions-table.table-content.modify')}
            title={t('pages.trade.positions-table.modify-modal.close')}
            onClick={() => handlePositionClose(position)}
            disabled={isSettlementInProgress}
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
          {!isSettlementInProgress && (
            <>
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
                    ? formatToCurrency(
                        position.collateralCC * collToSettleInfo.value,
                        collToSettleInfo.settleSymbol,
                        true
                      )
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
            </>
          )}
        </Box>
        {isSettlementInProgress && (
          <>
            {perpetualState?.state !== 'CLEARED' && (
              <Typography variant="bodySmall" align="center" component="p" className={styles.symbol}>
                Settlement in progress...
              </Typography>
            )}
            {perpetualState?.state === 'CLEARED' && (
              <Button onClick={() => handlePositionClaim(position)} variant="secondary" className={styles.actionButton}>
                {t('pages.trade.positions-table.modify-modal.claim')}
              </Button>
            )}
          </>
        )}
      </Box>
    );
  }
);

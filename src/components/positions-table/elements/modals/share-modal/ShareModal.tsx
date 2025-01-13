import classnames from 'classnames';
import { useAtomValue } from 'jotai';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DownloadOutlined } from '@mui/icons-material';
import { Button, Dialog as MuiDialog, DialogActions, DialogContent } from '@mui/material';

import LogoWithText from 'assets/logoWithText.svg?react';
import { calculateProbability } from 'helpers/calculateProbability';
import { parseSymbol } from 'helpers/parseSymbol';
import { collateralToSettleConversionAtom, traderAPIAtom } from 'store/pools.store';
import { MarginAccountWithAdditionalDataI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { Background } from './Background';

import styles from './ShareModal.module.scss';

interface ShareModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountWithAdditionalDataI | null;
  closeModal: () => void;
}

export const ShareModal = memo(({ isOpen, selectedPosition, closeModal }: ShareModalPropsI) => {
  const { t } = useTranslation();

  const c2s = useAtomValue(collateralToSettleConversionAtom);
  const traderAPI = useAtomValue(traderAPIAtom);

  let isPredictionMarket;
  try {
    isPredictionMarket = selectedPosition ? traderAPI?.isPredictionMarket(selectedPosition.symbol) : false;
  } catch (error) {
    // skip
  }

  const statsRef = useRef<HTMLDivElement>(null);

  if (!selectedPosition) {
    return null;
  }

  const saveImage = async () => {
    if (!statsRef.current) {
      return;
    }
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(statsRef.current, { pixelRatio: 5 });
    const img = new Image();
    img.src = dataUrl;
    document.body.appendChild(img);

    const link = document.createElement('a');

    link.href = dataUrl;
    link.download = 'd8x-position.jpg';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    document.body.removeChild(img);
  };

  const parsedSymbol = parseSymbol(selectedPosition.symbol);
  const collToSettleInfo = parsedSymbol?.poolSymbol ? c2s.get(parsedSymbol.poolSymbol) : undefined;

  const percent =
    100 *
    (selectedPosition.unrealizedPnlQuoteCCY / (selectedPosition.collateralCC * selectedPosition.collToQuoteConversion));

  const displayEntryPrice = selectedPosition
    ? formatToCurrency(
        isPredictionMarket
          ? calculateProbability(selectedPosition.entryPrice, selectedPosition.side === 'Short')
          : selectedPosition.entryPrice,
        parsedSymbol?.quoteCurrency,
        true
      )
    : '';

  const displayMarkPrice = selectedPosition
    ? formatToCurrency(
        isPredictionMarket
          ? calculateProbability(selectedPosition.markPrice, selectedPosition.side === 'Short')
          : selectedPosition.markPrice,
        parsedSymbol?.quoteCurrency,
        true
      )
    : '';

  return (
    <MuiDialog open={isOpen} onClose={closeModal} className={styles.dialog}>
      <DialogContent className={styles.contentBlock}>
        <div ref={statsRef} className={styles.statsContainer}>
          <Background />
          <LogoWithText width={129} height={30} />
          <div className={styles.titleBlock}>
            <span
              className={classnames({
                [styles.sideLong]: selectedPosition?.side === 'BUY',
                [styles.sideShort]: selectedPosition?.side !== 'BUY',
              })}
            >
              {selectedPosition?.side === 'BUY'
                ? t('pages.trade.order-block.selector.long')
                : t('pages.trade.order-block.selector.short')}
            </span>
            |
            <span>
              {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}/{collToSettleInfo?.settleSymbol ?? ''}{' '}
              {t('pages.trade.history-table.table-header.perpetual')}
            </span>
            |<span>{Math.round(selectedPosition.leverage * 100) / 100}x</span>
          </div>
          <div
            className={classnames(styles.pnlPercent, {
              [styles.pnlPercentPositive]: percent > 0,
            })}
          >
            {percent > 0 ? '+' : ''}
            {Math.round(percent * 100) / 100}%
          </div>
          <div className={styles.pricesContainer}>
            <div className={styles.priceLine}>
              <div>{t('pages.trade.positions-table.table-header.entry-price')}</div>
              <div>{displayEntryPrice}</div>
            </div>
            <div className={styles.priceLine}>
              <div>{t('pages.trade.stats.mark-price')}</div>
              <div>{displayMarkPrice}</div>
            </div>
          </div>
          <div className={styles.originLink}>{window?.location.origin}</div>
        </div>
        <div className={styles.shareBlock}>
          <DownloadOutlined onClick={saveImage} className={styles.downloadButton} />
          <div>{t('pages.trade.positions-table.share-modal.share-description')}</div>
        </div>
      </DialogContent>
      <DialogActions className={styles.modalActions}>
        <Button onClick={closeModal} variant="secondary" size="small">
          {t('common.info-modal.close')}
        </Button>
      </DialogActions>
    </MuiDialog>
  );
});

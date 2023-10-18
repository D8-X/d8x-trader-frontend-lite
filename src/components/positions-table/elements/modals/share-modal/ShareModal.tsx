import classnames from 'classnames';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DownloadOutlined } from '@mui/icons-material';
import { Button, DialogActions, DialogContent } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { InteractiveLogo } from 'components/header/elements/interactive-logo/InteractiveLogo';
import { parseSymbol } from 'helpers/parseSymbol';
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

  const percent =
    100 *
    (selectedPosition.unrealizedPnlQuoteCCY / (selectedPosition.collateralCC * selectedPosition.collToQuoteConversion));

  return (
    <Dialog open={isOpen} onClose={closeModal} className={styles.dialog}>
      <DialogContent className={styles.contentBlock}>
        <div ref={statsRef} className={styles.statsContainer}>
          <Background />
          <InteractiveLogo />
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
              {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}/{parsedSymbol?.poolSymbol}{' '}
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
              <div>{formatToCurrency(selectedPosition.entryPrice, parsedSymbol?.quoteCurrency, true)}</div>
            </div>
            <div className={styles.priceLine}>
              <div>{t('pages.trade.stats.mark-price')}</div>
              <div>{formatToCurrency(selectedPosition.markPrice, parsedSymbol?.quoteCurrency, true)}</div>
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
    </Dialog>
  );
});

import classnames from 'classnames';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';

import { DownloadOutlined } from '@mui/icons-material';
import { Button, DialogActions, DialogContent } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { InteractiveLogo } from 'components/header/elements/interactive-logo/InteractiveLogo';
import { MarginAccountWithAdditionalDataI } from 'types/types';
import { enabledDarkModeAtom } from 'store/app.store';

import { parseSymbol } from 'helpers/parseSymbol';
import { formatToCurrency } from 'utils/formatToCurrency';
import styles from './ShareModal.module.scss';
import DarkmodeBackground from './darkmode.png';
import LightmodeBackground from './lightmode.png';

interface ShareModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountWithAdditionalDataI | null;
  closeModal: () => void;
}

export const ShareModal = memo(({ isOpen, selectedPosition, closeModal }: ShareModalPropsI) => {
  const { t } = useTranslation();
  const statsRef = useRef<HTMLDivElement>(null);
  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);

  if (!selectedPosition) {
    return null;
  }

  const parsedSymbol = parseSymbol(selectedPosition.symbol);

  const percent =
    100 *
    (selectedPosition.unrealizedPnlQuoteCCY / (selectedPosition.collateralCC * selectedPosition.collToQuoteConversion));

  return (
    <Dialog open={isOpen} onClose={closeModal} className={styles.dialog}>
      <DialogContent className={styles.contentBlock}>
        <div ref={statsRef} className={styles.statsContainer}>
          <img
            src={enabledDarkMode ? DarkmodeBackground : LightmodeBackground}
            className={styles.backgroundImage}
            alt="stats background"
          />
          <InteractiveLogo />
          <div>
            <span
              className={classnames({
                [styles.sideLong]: selectedPosition?.side === 'BUY',
                [styles.sideShort]: selectedPosition?.side !== 'BUY',
              })}
            >
              {selectedPosition?.side === 'BUY' ? 'Long' : 'Short'}
            </span>{' '}
            | {selectedPosition?.symbol} Perpetual | {Math.round(selectedPosition.leverage * 100) / 100}x
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
              <div>Entry Price</div>
              <div>{formatToCurrency(selectedPosition.entryPrice, parsedSymbol?.quoteCurrency, true)}</div>
            </div>
            <div className={styles.priceLine}>
              <div>Mark Price</div>
              <div>{formatToCurrency(selectedPosition.markPrice, parsedSymbol?.quoteCurrency, true)}</div>
            </div>
          </div>
          <div className={styles.originLink}>{window?.location.origin}</div>
        </div>
        <div className={styles.shareBlock}>
          <DownloadOutlined
            onClick={async () => {
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
            }}
            className={styles.downloadButton}
          />
          <div>Save the image and share it on social media</div>
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

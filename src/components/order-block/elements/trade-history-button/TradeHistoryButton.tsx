import { memo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import TradeHistoryIcon from 'assets/icons/new/tradeHistory.svg?react';
import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';
import { TradeShortHistoryModal } from 'components/trade-short-history-modal/TradeShortHistoryModal';

import styles from './TradeHistoryButton.module.scss';

export const TradeHistoryButton = memo(() => {
  const { t } = useTranslation();

  const [isModalOpen, setModalOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <div className={styles.root}>
      <TooltipMobile tooltip={t('pages.trade.history-table.table-title')}>
        <Button onClick={() => setModalOpen(true)} className={styles.iconButton} variant="outlined" ref={buttonRef}>
          <TradeHistoryIcon className={styles.icon} />
        </Button>
      </TooltipMobile>

      <TradeShortHistoryModal isModalOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
});

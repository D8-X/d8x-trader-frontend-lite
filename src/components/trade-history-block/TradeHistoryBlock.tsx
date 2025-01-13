import classnames from 'classnames';
import { useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, Typography } from '@mui/material';

import { Separator } from 'components/separator/Separator';
import { tradeHistoryModalOpenAtom } from 'store/global-modals.store';

import { TradeHistoryBlockItems } from '../trade-history-block-items/TradeHistoryBlockItems';
import { TradeHistoryModal } from '../trade-history-modal/TradeHistoryModal';
import { useTradesHistory } from '../trade-history-table/hooks/useTradesHistory';

import styles from './TradeHistoryBlock.module.scss';

export const TradeHistoryBlock = () => {
  const { t } = useTranslation();

  const setTradeHistoryModalOpen = useSetAtom(tradeHistoryModalOpenAtom);

  const { tradesHistory } = useTradesHistory();

  const handleViewAllClick = useCallback(() => {
    setTradeHistoryModalOpen(true);
  }, [setTradeHistoryModalOpen]);

  const partOfTradeHistory = useMemo(() => {
    return tradesHistory.slice(0, 5);
  }, [tradesHistory]);

  return (
    <>
      <Card className={styles.root}>
        <CardContent className={classnames(styles.card, styles.header)}>
          <Typography className={styles.label}>{t('pages.trade.history-table.table-title')}</Typography>
          {partOfTradeHistory.length > 0 && (
            <Typography variant="bodySmall" className={styles.viewAllLabel} onClick={handleViewAllClick}>
              {t('common.view-all')}
            </Typography>
          )}
        </CardContent>
        <Separator className={styles.separator} />
        <CardContent className={classnames(styles.card, styles.itemsHolder)}>
          <TradeHistoryBlockItems tradesHistory={partOfTradeHistory} />
        </CardContent>
      </Card>

      <TradeHistoryModal />
    </>
  );
};

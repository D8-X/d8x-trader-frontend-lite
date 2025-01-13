import { useTranslation } from 'react-i18next';

import type { TradeHistoryWithSymbolDataI } from 'types/types';

import { TradeHistoryItem } from './elements/trade-history-item/TradeHistoryItem';

import styles from './TradeHistoryBlockItems.module.scss';

interface TradeHistoryBlockItemsPropsI {
  tradesHistory: TradeHistoryWithSymbolDataI[];
}

export const TradeHistoryBlockItems = ({ tradesHistory }: TradeHistoryBlockItemsPropsI) => {
  const { t } = useTranslation();

  return (
    <>
      {tradesHistory.length > 0 &&
        tradesHistory.map((trade) => <TradeHistoryItem key={trade.orderId} tradeHistory={trade} />)}
      {tradesHistory.length === 0 && (
        <div className={styles.noDataBlock}>
          <div className={styles.heading}>{t('pages.trade.history-table.table-content.no-open')}</div>
          <div className={styles.note}>{t('pages.trade.history-table.table-content.no-open-note')}</div>
        </div>
      )}
    </>
  );
};

import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Dialog } from 'components/dialog/Dialog';
import { TradeHistoryTable } from 'components/trade-history-table/TradeHistoryTable';
import { tradeHistoryModalOpenAtom } from 'store/global-modals.store';

import styles from './TradeHistoryModal.module.scss';

export const TradeHistoryModal = () => {
  const { t } = useTranslation();

  const [isTradeHistoryModalOpen, setTradeHistoryModalOpen] = useAtom(tradeHistoryModalOpenAtom);

  const handleOnClose = () => {
    setTradeHistoryModalOpen(false);
  };

  return (
    <Dialog
      open={isTradeHistoryModalOpen}
      onClose={handleOnClose}
      onCloseClick={handleOnClose}
      className={styles.dialog}
      dialogTitle={t('pages.trade.history-table.table-title')}
    >
      <TradeHistoryTable />
    </Dialog>
  );
};

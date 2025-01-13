import classnames from 'classnames';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { DATETIME_FORMAT } from 'appConstants';
import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { formatToCurrency } from 'utils/formatToCurrency';
import type { TradeHistoryWithSymbolDataI } from 'types/types';

import styles from './TradeHistoryItem.module.scss';

interface TradeHistoryItemPropsI {
  tradeHistory: TradeHistoryWithSymbolDataI;
}

export const TradeHistoryItem = ({ tradeHistory }: TradeHistoryItemPropsI) => {
  const { t } = useTranslation();

  const time = format(new Date(tradeHistory.timestamp), DATETIME_FORMAT);

  return (
    <div className={styles.root}>
      <div className={styles.iconsHolder}>
        <div className={styles.baseIcon}>
          <DynamicLogo logoName={tradeHistory.perpetual?.baseCurrency.toLowerCase() ?? ''} width={18} height={18} />
        </div>
        <div className={styles.quoteIcon}>
          <DynamicLogo logoName={tradeHistory.perpetual?.quoteCurrency.toLowerCase() ?? ''} width={18} height={18} />
        </div>
      </div>
      <div className={styles.dataHolder}>
        <div className={styles.leftBlock}>
          <span className={styles.pair}>
            {tradeHistory.perpetual?.baseCurrency}/{tradeHistory.perpetual?.quoteCurrency}
          </span>
          <span className={styles.date}>{time}</span>
        </div>
        <div className={styles.rightBlock}>
          <span className={styles.amount}>
            {tradeHistory.perpetual
              ? formatToCurrency(Math.abs(tradeHistory.quantity), tradeHistory.perpetual.baseCurrency, true)
              : ''}
          </span>
          <span
            className={classnames(styles.side, {
              [styles.buy]: tradeHistory.side.indexOf('BUY') > -1,
              [styles.sell]: tradeHistory.side.indexOf('SELL') > -1,
            })}
          >
            {tradeHistory.side.indexOf('BUY') > -1
              ? t('pages.trade.positions-table.table-content.buy')
              : t('pages.trade.positions-table.table-content.sell')}
          </span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

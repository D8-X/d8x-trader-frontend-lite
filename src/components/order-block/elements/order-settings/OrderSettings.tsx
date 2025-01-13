import { useAtomValue } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ExpirySelector } from 'components/order-block/elements/expiry-selector/ExpirySelector';
import { SlippageSelector } from 'components/order-block/elements/slippage-selector/SlippageSelector';
import { orderTypeAtom } from 'store/order-block.store';
import { OrderTypeE } from 'types/enums';

import styles from './OrderSettings.module.scss';

export const OrderSettings = memo(() => {
  const { t } = useTranslation();

  const orderType = useAtomValue(orderTypeAtom);

  return (
    <div className={styles.root}>
      {orderType === OrderTypeE.Market && (
        <div className={styles.settings}>
          <div className={styles.label}>{t('pages.trade.order-block.slippage.title')}</div>
          <div className={styles.options}>
            <SlippageSelector />
          </div>
        </div>
      )}
      {orderType !== OrderTypeE.Market && (
        <div className={styles.settings}>
          <div className={styles.label}>{t('pages.trade.order-block.expiry.title')}</div>
          <div className={styles.options}>
            <ExpirySelector />
          </div>
        </div>
      )}
    </div>
  );
});

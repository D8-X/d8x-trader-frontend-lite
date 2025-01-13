import classnames from 'classnames';
import { useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { orderTypeAtom } from 'store/order-block.store';
import { OrderTypeE } from 'types/enums';

import styles from './OrderTypeSelector.module.scss';

export const OrderTypeSelector = memo(() => {
  const { t } = useTranslation();

  const [orderType, setOrderType] = useAtom(orderTypeAtom);

  return (
    <div className={styles.root}>
      {Object.values(OrderTypeE).map((key) => (
        <div
          key={key}
          className={classnames(styles.type, { [styles.selected]: key === orderType })}
          onClick={() => setOrderType(key)}
        >
          {t(`pages.trade.order-block.order-type.${OrderTypeE[key].toLowerCase()}`)}
        </div>
      ))}
    </div>
  );
});

import classnames from 'classnames';
import { useAtom, useAtomValue } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { longShortToYesNoMap } from 'helpers/longShortToYesNoMap';
import { orderBlockAtom } from 'store/order-block.store';
import { selectedPerpetualDataAtom } from 'store/pools.store';
import { OrderBlockE } from 'types/enums';

import styles from './OrderSelector.module.scss';

export const OrderSelector = memo(() => {
  const { t } = useTranslation();

  const [orderBlock, setOrderBlock] = useAtom(orderBlockAtom);
  const selectedPerpetualData = useAtomValue(selectedPerpetualDataAtom);

  const isPredictionMarket = selectedPerpetualData?.isPredictionMarket ?? false;

  return (
    <div className={styles.rootOptions}>
      {Object.values(OrderBlockE).map((key) => (
        <Button
          key={key}
          className={classnames({ [styles.selected]: key === orderBlock })}
          onClick={() => setOrderBlock(key)}
        >
          {isPredictionMarket
            ? t(`pages.trade.order-block.prediction.${longShortToYesNoMap[key.toLowerCase()]}`)
            : t(`pages.trade.order-block.selector.${key.toLowerCase()}`)}
        </Button>
      ))}
    </div>
  );
});

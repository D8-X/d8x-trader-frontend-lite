import classnames from 'classnames';
import { memo } from 'react';

import { Card, CardContent } from '@mui/material';

import { Separator } from '../separator/Separator';
import { ActionBlock } from './elements/action-block/ActionBlock';
import { InfoBlock } from './elements/info-block/InfoBlock';
import { LeverageSelector } from './elements/leverage-selector/LeverageSelector';
import { LimitPrice } from './elements/limit-price/LimitPrice';
import { OrderSelector } from './elements/order-selector/OrderSelector';
import { OrderSize } from './elements/order-size/OrderSize';
import { OrderTypeSelector } from './elements/order-type-selector/OrderTypeSelector';
import { StopLossSelector } from './elements/stop-loss-selector/StopLossSelector';
import { TakeProfitSelector } from './elements/take-profit-selector/TakeProfitSelector';
import { TriggerPrice } from './elements/trigger-price/TriggerPrice';

import styles from './OrderBlock.module.scss';

export const OrderBlock = memo(() => {
  return (
    <Card className={styles.root}>
      <OrderSelector />
      <CardContent className={styles.card}>
        <OrderTypeSelector />
        <LeverageSelector />
      </CardContent>
      <Separator className={styles.separator} />
      <CardContent className={styles.card}>
        <TriggerPrice />
        <LimitPrice />
        <OrderSize />
      </CardContent>
      <Separator className={styles.separator} />
      <CardContent className={classnames(styles.card, styles.selectors)}>
        <StopLossSelector />
        <TakeProfitSelector />
      </CardContent>
      <CardContent className={styles.bottomCard}>
        <InfoBlock />
        <ActionBlock />
      </CardContent>
    </Card>
  );
});

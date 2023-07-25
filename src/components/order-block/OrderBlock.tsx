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
import { TriggerPrice } from './elements/trigger-price/TriggerPrice';
import { StopLossSelector } from './elements/stop-loss-selector/StopLossSelector';
import { TakeProfitSelector } from './elements/take-profit-selector/TakeProfitSelector';

import styles from './OrderBlock.module.scss';

export const OrderBlock = memo(() => {
  return (
    <Card className={styles.root}>
      <OrderSelector />
      <CardContent className={styles.card}>
        <OrderTypeSelector />
        <OrderSize />
        <TriggerPrice />
        <LimitPrice />
      </CardContent>
      <Separator />
      <CardContent className={styles.card}>
        <LeverageSelector />
      </CardContent>
      <Separator />
      <CardContent className={styles.card}>
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

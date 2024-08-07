import classnames from 'classnames';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSetAtom } from 'jotai';

import { ArrowForward } from '@mui/icons-material';
import { Card, CardContent, Link } from '@mui/material';
import { useAccount } from 'wagmi';

import { depositModalOpenAtom } from 'store/global-modals.store';
import { isEnabledChain } from 'utils/isEnabledChain';

// import { Separator } from '../separator/Separator';
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
  const { t } = useTranslation();

  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);
  const { chainId, isConnected } = useAccount();

  return (
    <Card className={styles.root}>
      <OrderSelector />
      <CardContent className={styles.card}>
        <OrderTypeSelector />
        <LeverageSelector />
      </CardContent>
      {/*<Separator className={styles.separator} />*/}
      <CardContent className={styles.card}>
        <TriggerPrice />
        <LimitPrice />
        <OrderSize />
      </CardContent>
      {/*<Separator className={styles.separator} />*/}
      <CardContent className={classnames(styles.card, styles.selectors)}>
        <StopLossSelector />
        <TakeProfitSelector />
      </CardContent>
      <CardContent className={styles.bottomCard}>
        <InfoBlock />
        <ActionBlock />
        {isConnected && isEnabledChain(chainId) && (
          <Link onClick={() => setDepositModalOpen(true)} className={styles.depositLink}>
            <ArrowForward fontSize="small" />
            <span className={styles.textOffset}>{t('common.deposit-modal.title')}</span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
});

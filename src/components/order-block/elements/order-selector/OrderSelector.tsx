import classnames from 'classnames';
import { useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, CardHeader } from '@mui/material';

import { orderBlockAtom } from 'store/order-block.store';
import { OrderBlockE } from 'types/enums';

import styles from './OrderSelector.module.scss';

export const OrderSelector = memo(() => {
  const { t } = useTranslation();

  const [orderBlock, setOrderBlock] = useAtom(orderBlockAtom);

  return (
    <CardHeader
      title={
        <Box className={styles.rootOptions}>
          {Object.values(OrderBlockE).map((key) => (
            <Button
              key={key}
              className={classnames({ [styles.selected]: key === orderBlock })}
              onClick={() => setOrderBlock(key)}
            >
              {t(`pages.trade.order-block.selector.${key.toLowerCase()}`)}
            </Button>
          ))}
        </Box>
      }
      className={styles.root}
    />
  );
});

import classnames from 'classnames';
import { memo } from 'react';

import { Typography } from '@mui/material';

import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';

import type { StatDataI } from './types';

import styles from './StatsLine.module.scss';

interface StatsLinePropsI {
  items: StatDataI[];
}

export const StatsLine = memo(({ items }: StatsLinePropsI) => (
  <div className={styles.root}>
    {items.map((item) => {
      const isMidPrice = item.id === 'midPrice';

      return (
        <div
          key={item.id}
          className={classnames(styles.statContainer, {
            [styles.midPriceContainer]: isMidPrice,
          })}
        >
          {!isMidPrice && item.tooltip ? (
            <TooltipMobile tooltip={item.tooltip}>
              <Typography variant="bodyTiny" className={classnames(styles.statLabel, styles.tooltip)}>
                {item.label}
              </Typography>
            </TooltipMobile>
          ) : (
            !isMidPrice && (
              <Typography variant="bodyTiny" className={styles.statLabel}>
                {item.label}
              </Typography>
            )
          )}

          {isMidPrice && item.tooltip ? (
            <TooltipMobile tooltip={item.tooltip}>
              <Typography variant="bodyLarge" className={item.className}>
                {item.numberOnly}
              </Typography>
            </TooltipMobile>
          ) : (
            isMidPrice && (
              <Typography variant="bodyLarge" className={item.className}>
                {item.numberOnly}
              </Typography>
            )
          )}

          {!isMidPrice && (
            <div className={styles.statValueContainer}>
              <Typography variant="bodyLarge" className={styles.statValue}>
                {item.numberOnly}
              </Typography>
              <Typography variant="bodyTiny" className={styles.statCurrency}>
                {item.currencyOnly}
              </Typography>
            </div>
          )}
        </div>
      );
    })}
  </div>
));

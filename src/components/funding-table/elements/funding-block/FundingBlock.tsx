import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { SidesRow } from 'components/sides-row/SidesRow';
import type { PerpetualDataI, TableHeaderI, FundingI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './FundingBlock.module.scss';

interface FundingRowPropsI {
  headers: TableHeaderI[];
  perpetuals: PerpetualDataI[];
  funding: FundingI;
}

export const FundingBlock = ({ headers, perpetuals, funding }: FundingRowPropsI) => {
  const { t } = useTranslation();
  const perpetual = perpetuals.find(({ id }) => id === funding.perpetualId);
  const time = format(new Date(funding.timestamp), 'yyyy-MM-dd HH:mm:ss');

  return (
    <Box className={styles.root}>
      <Box className={styles.headerWrapper}>
        <Box className={styles.leftSection}>
          <Typography variant="bodySmall" component="p">
            {t('pages.trade.funding-table.funding-block-mobile.symbol')}
          </Typography>
          <Typography variant="bodySmall" component="p" className={styles.symbol}>
            {perpetual ? `${perpetual.baseCurrency}-${perpetual.quoteCurrency}` : ''}
          </Typography>
        </Box>
      </Box>
      <Box className={styles.dataWrapper}>
        <SidesRow
          leftSide={headers[0].label}
          rightSide={time}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[2].label}
          rightSide={perpetual ? formatToCurrency(funding.amount, perpetual.poolName, true) : ''}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
      </Box>
    </Box>
  );
};

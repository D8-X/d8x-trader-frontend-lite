import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { DATETIME_FORMAT } from 'appConstants';
import { SidesRow } from 'components/sides-row/SidesRow';
import type { FundingWithSymbolDataI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './FundingBlock.module.scss';

interface FundingRowPropsI {
  headers: TableHeaderI<FundingWithSymbolDataI>[];
  funding: FundingWithSymbolDataI;
}

export const FundingBlock = ({ headers, funding }: FundingRowPropsI) => {
  const { t } = useTranslation();

  const perpetual = funding.perpetual;
  const time = format(new Date(funding.timestamp), DATETIME_FORMAT);

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

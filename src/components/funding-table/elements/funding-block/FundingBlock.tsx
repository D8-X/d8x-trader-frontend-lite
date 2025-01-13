import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { DATETIME_FORMAT } from 'appConstants';
import { SidesRow } from 'components/sides-row/SidesRow';
import type { FundingWithSymbolDataI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './FundingBlock.module.scss';
import { useAtomValue } from 'jotai';
import { collateralToSettleConversionAtom } from 'store/pools.store';

interface FundingRowPropsI {
  headers: TableHeaderI<FundingWithSymbolDataI>[];
  funding: FundingWithSymbolDataI;
}

export const FundingBlock = ({ headers, funding }: FundingRowPropsI) => {
  const { t } = useTranslation();

  const c2s = useAtomValue(collateralToSettleConversionAtom);

  const perpetual = funding.perpetual;
  const time = format(new Date(funding.timestamp), DATETIME_FORMAT);
  const fundingColor = funding.amount >= 0 ? styles.green : styles.red;

  return (
    <Box className={styles.root}>
      <Box className={styles.headerWrapper}>
        <Box className={styles.leftSection}>
          <Typography variant="fourteen" component="p">
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
          leftSideTooltip={headers[0].tooltip}
          rightSide={time}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[2].label}
          leftSideTooltip={headers[2].tooltip}
          rightSide={
            perpetual
              ? formatToCurrency(funding.amount * (c2s.get(perpetual.poolName)?.value ?? 1), funding.settleSymbol, true)
              : ''
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={fundingColor}
        />
      </Box>
    </Box>
  );
};

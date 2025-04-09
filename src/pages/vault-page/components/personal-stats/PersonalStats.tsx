import { useAtomValue } from 'jotai';
import { memo, useState, useMemo, useEffect } from 'react';
//  import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount } from 'wagmi';

import { Table as MuiTable, TableBody, TableContainer, TableHead, TableRow } from '@mui/material';
import classnames from 'classnames';

import { flatTokenAtom, selectedPoolAtom, poolsAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';
import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { getComparator, stableSort } from 'helpers/tableSort';
import { AlignE, FieldTypeE, SortOrderE } from 'types/enums';
import type { TableHeaderI } from 'types/types';
import { getLpActionHistory, type LpActionHistoryItemI } from 'network/network';

import styles from './PersonalStats.module.scss';

const MIN_WIDTH_FOR_TABLE = 768;

// Define the data structure for the table
interface WithdrawalHistoryI {
  id: string;
  action: string;
  date: string;
  poolShareTokenPrice: number;
  lp_tokens_dec: number;
  sh_tokens_dec: number;
}

export const PersonalStats = memo(() => {
  //const { t } = useTranslation();
  const { width, ref } = useResizeDetector();
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof WithdrawalHistoryI>('date');
  const [lpActionHistory, setLpActionHistory] = useState<LpActionHistoryItemI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const flatToken = useAtomValue(flatTokenAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);

  const pools = useAtomValue(poolsAtom);
  console.log(pools);
  const { chainId, address } = useAccount();

  const shareSymbol = `d${selectedPool?.settleSymbol}`;

  const [userSymbol] =
    !!flatToken && selectedPool?.poolId === flatToken.poolId && !!flatToken.registeredSymbol
      ? [flatToken.registeredSymbol]
      : [selectedPool?.poolSymbol ?? ''];

  // Define the table headers
  const withdrawalHeaders: TableHeaderI<WithdrawalHistoryI>[] = useMemo(
    () => [
      {
        field: 'action',
        label: 'Action',
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'date',
        label: 'Date',
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'poolShareTokenPrice',
        label: 'Pool Share Price',
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'lp_tokens_dec',
        label: 'LP Tokens',
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'sh_tokens_dec',
        label: 'Share Tokens',
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
    ],
    []
  );

  // Fetch LP action history when component mounts or when address/pools change
  useEffect(() => {
    const fetchLpActionHistory = async () => {
      if (!address || !pools.length || !chainId) return;

      setIsLoading(true);
      try {
        // Get history for the selected pool
        if (selectedPool?.poolSymbol) {
          const history = await getLpActionHistory(chainId, address, selectedPool.poolSymbol);
          setLpActionHistory(history);
        }
      } catch (error) {
        console.error('Error fetching LP action history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLpActionHistory();
  }, [address, chainId, pools, selectedPool?.poolSymbol]);

  // Map the LP action history to withdrawal history format
  const withdrawalHistory: WithdrawalHistoryI[] = useMemo(() => {
    return lpActionHistory.map((item, index) => {
      // Determine action type without nested ternary
      let action = item.event_type;
      if (item.event_type === 'share_token_p2p_transfer') {
        action = item.sh_tokens_dec < 0 ? 'Withdraw Request' : 'Deposit';
      }

      return {
        id: `${index}-${item.tx_hash.substring(0, 8)}`,
        action,
        date: new Date(item.created_at).toLocaleString(),
        poolShareTokenPrice: item.price_cc,
        lp_tokens_dec: item.lp_tokens_dec,
        sh_tokens_dec: Math.abs(item.sh_tokens_dec),
      };
    });
  }, [lpActionHistory]);

  // Sort the data
  const sortedHistory = useMemo(
    () => stableSort(withdrawalHistory, getComparator(order, orderBy)),
    [withdrawalHistory, order, orderBy]
  );

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={classnames(styles.tableHolder, styles.withBackground)}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                <SortableHeaders<WithdrawalHistoryI>
                  headers={withdrawalHeaders}
                  order={order}
                  orderBy={orderBy}
                  setOrder={setOrder}
                  setOrderBy={setOrderBy}
                />
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {isLoading ? (
                <TableRow>
                  <td colSpan={withdrawalHeaders.length} className={styles.loadingCell}>
                    Loading history...
                  </td>
                </TableRow>
              ) : sortedHistory.length > 0 ? (
                sortedHistory.map((item) => (
                  <TableRow key={item.id} className={styles.tableRow}>
                    <td className={styles.cellLeft}>{item.action}</td>
                    <td className={styles.cellLeft}>{item.date}</td>
                    <td className={styles.cellRight}>{formatToCurrency(item.poolShareTokenPrice, 'USD')}</td>
                    <td className={styles.cellRight}>{formatToCurrency(item.lp_tokens_dec, userSymbol)}</td>
                    <td className={styles.cellRight}>{formatToCurrency(item.sh_tokens_dec, shareSymbol)}</td>
                  </TableRow>
                ))
              ) : (
                <EmptyRow colSpan={withdrawalHeaders.length} text="No withdrawal history found" />
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>
      )}
      {(!width || width < MIN_WIDTH_FOR_TABLE) && (
        <div className={styles.blocksHolder}>
          {isLoading ? (
            <div className={styles.loading}>Loading history...</div>
          ) : sortedHistory.length > 0 ? (
            sortedHistory.map((item) => (
              <div key={item.id} className={styles.block}>
                <div className={styles.blockRow}>
                  <div className={styles.blockLabel}>Action:</div>
                  <div className={styles.blockValue}>{item.action}</div>
                </div>
                <div className={styles.blockRow}>
                  <div className={styles.blockLabel}>Date:</div>
                  <div className={styles.blockValue}>{item.date}</div>
                </div>
                <div className={styles.blockRow}>
                  <div className={styles.blockLabel}>Pool Share Price:</div>
                  <div className={styles.blockValue}>{formatToCurrency(item.poolShareTokenPrice, 'USD')}</div>
                </div>
                <div className={styles.blockRow}>
                  <div className={styles.blockLabel}>LP Tokens:</div>
                  <div className={styles.blockValue}>{formatToCurrency(item.lp_tokens_dec, userSymbol)}</div>
                </div>
                <div className={styles.blockRow}>
                  <div className={styles.blockLabel}>Share Tokens:</div>
                  <div className={styles.blockValue}>{formatToCurrency(item.sh_tokens_dec, shareSymbol)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noData}>No withdrawal history found</div>
          )}
        </div>
      )}
    </div>
  );
});

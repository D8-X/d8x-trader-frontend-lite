import { useAtomValue } from 'jotai';
import { memo, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  rawDate: Date;
  date: string;
  poolShareTokenPrice: number;
  lp_tokens_dec: number | string;
  sh_tokens_dec: number;
  shareSymbol: string;
  userSymbol: string;
}

export const PersonalStats = memo(() => {
  const { t } = useTranslation();
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

  console.log('flattoken', flatToken);
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
        field: 'rawDate',
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
      if (!address || !pools.length || !chainId) {
        setLpActionHistory([]); // Clear history when requirements aren't met
        return;
      }

      setIsLoading(true);
      try {
        // Create an array of promises for all pools
        const historyPromises = pools.map((pool) => getLpActionHistory(chainId, address, pool.poolSymbol));

        // Wait for all requests to complete
        const allHistoryResults = await Promise.all(historyPromises);

        // Combine all results into a single array
        const combinedHistory = allHistoryResults.flat().map((historyItem) => {
          // Find the pool that matches the item's pool_id
          const matchingPool = pools.find((pool) => pool.poolId === historyItem.pool_id);

          // Create shareSymbol and userSymbol
          const shareSymbol = matchingPool ? `d${matchingPool.settleSymbol}` : '';
          const userSymbol =
            matchingPool && !!flatToken && matchingPool?.poolId === flatToken.poolId && !!flatToken.registeredSymbol
              ? flatToken.registeredSymbol
              : matchingPool?.settleSymbol || '';

          return {
            ...historyItem,
            shareSymbol,
            userSymbol,
          };
        });

        // Set the combined history
        setLpActionHistory(combinedHistory);
      } catch (error) {
        console.error('Error fetching LP action history:', error);
        setLpActionHistory([]); // Reset to empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchLpActionHistory();
  }, [address, chainId, pools, selectedPool?.poolSymbol, flatToken]);

  // Map the LP action history to withdrawal history format
  const withdrawalHistory: WithdrawalHistoryI[] = useMemo(() => {
    return lpActionHistory.map((item, index) => {
      const txId = item.tx_hash ? item.tx_hash.substring(0, 8) : `unknown-${index}`;

      // Determine action type without nested ternary
      let action;
      switch (item.event_type) {
        case 'liquidity_added':
          action = t('pages.vault.toast.added');
          break;
        case 'liquidity_removed':
          action = t('pages.vault.toast.withdrawn');
          break;
        case 'share_token_p2p_transfer':
          action = t('pages.vault.toast.transfered');
          break;
        default:
          action = item.event_type;
      }

      const lpTokens = item.event_type === 'share_token_p2p_transfer' ? '-' : Number(item.lp_tokens_dec);
      const rawDate = new Date(item.created_at);

      const shareSymbol = item.shareSymbol || '';
      const userSymbol = item.userSymbol || '';

      return {
        id: `${index}-${txId}`,
        action,
        rawDate,
        date: rawDate.toLocaleString(),
        poolShareTokenPrice: item.price_cc,
        lp_tokens_dec: lpTokens,
        sh_tokens_dec: -item.sh_tokens_dec,
        shareSymbol: shareSymbol,
        userSymbol: userSymbol,
      };
    });
  }, [lpActionHistory, t]);

  // Sort the data
  const sortedHistory = useMemo(
    () => stableSort(withdrawalHistory, getComparator(order, orderBy)),
    [withdrawalHistory, order, orderBy]
  );

  // Pre-compute table content to avoid nested ternaries
  let tableContent;
  if (isLoading) {
    tableContent = (
      <TableRow>
        <td colSpan={withdrawalHeaders.length} className={styles.loadingCell}>
          Loading history...
        </td>
      </TableRow>
    );
  } else if (sortedHistory.length > 0) {
    tableContent = sortedHistory.map((item) => (
      <TableRow key={item.id} className={styles.tableRow}>
        <td className={styles.cellLeft}>{item.action}</td>
        <td className={styles.cellLeft}>{item.date}</td>
        <td className={styles.cellRight}>{formatToCurrency(item.poolShareTokenPrice, 'USD')}</td>
        <td className={styles.cellRight}>
          {typeof item.lp_tokens_dec === 'string'
            ? item.lp_tokens_dec
            : formatToCurrency(item.lp_tokens_dec, item.userSymbol)}
        </td>
        <td className={styles.cellRight}>{formatToCurrency(item.sh_tokens_dec, item.shareSymbol)}</td>
      </TableRow>
    ));
  } else {
    tableContent = <EmptyRow colSpan={withdrawalHeaders.length} text="No withdrawal history found" />;
  }

  // Similarly for mobile view
  let mobileContent;
  if (isLoading) {
    mobileContent = <div className={styles.loading}>Loading history...</div>;
  } else if (sortedHistory.length > 0) {
    mobileContent = sortedHistory.map((item) => (
      <div key={item.id} className={styles.block}>
        <div className={styles.headerWrapper}>
          <div className={styles.leftSection}>
            <div className={styles.blockHighlight}>{item.action}</div>
          </div>
        </div>
        <div className={styles.dataWrapper}>
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
            <div className={styles.blockValue}>
              {typeof item.lp_tokens_dec === 'string'
                ? item.lp_tokens_dec
                : formatToCurrency(item.lp_tokens_dec, item.userSymbol)}
            </div>
          </div>
          <div className={styles.blockRow}>
            <div className={styles.blockLabel}>Share Tokens:</div>
            <div className={styles.blockValue}>{formatToCurrency(item.sh_tokens_dec, item.shareSymbol)}</div>
          </div>
        </div>
      </div>
    ));
  } else {
    mobileContent = <div className={styles.noData}>No withdrawal history found</div>;
  }

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
            <TableBody className={styles.tableBody}>{tableContent}</TableBody>
          </MuiTable>
        </TableContainer>
      )}
      {(!width || width < MIN_WIDTH_FOR_TABLE) && <div className={styles.blocksHolder}>{mobileContent}</div>}
    </div>
  );
});

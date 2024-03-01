import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { AssetLine } from 'components/asset-line/AssetLine';
import { realizedPnLListAtom } from 'pages/portfolio-page/store/fetchRealizedPnL';
import { unrealizedPnLListAtom } from 'pages/portfolio-page/store/fetchUnrealizedPnL';
import { formatCurrency } from 'utils/formatCurrency';

import styles from './Perpetuals.module.scss';

export const Perpetuals = () => {
  const { t } = useTranslation();

  const [unrealizedPnLList] = useAtom(unrealizedPnLListAtom);
  const [realizedPnLList] = useAtom(realizedPnLListAtom);

  return (
    <>
      <div className={styles.pnlBlock}>
        <div className={styles.pnlHeader}>{t('pages.portfolio.account-value.details.perps.realized')}</div>
        <div className={styles.assetsList}>
          {realizedPnLList.length
            ? realizedPnLList.map((token) => (
                <AssetLine key={token.symbol} symbol={token.symbol} value={formatCurrency(token.value)} />
              ))
            : 'No data'}
        </div>
      </div>
      <div className={styles.pnlBlock}>
        <div className={styles.pnlHeader}>{t('pages.portfolio.account-value.details.perps.unrealized')}</div>
        <div className={styles.assetsList}>
          {unrealizedPnLList.length
            ? unrealizedPnLList.map((token) => (
                <AssetLine key={token.symbol} symbol={token.symbol} value={formatCurrency(token.value)} />
              ))
            : 'No data'}
        </div>
      </div>
    </>
  );
};

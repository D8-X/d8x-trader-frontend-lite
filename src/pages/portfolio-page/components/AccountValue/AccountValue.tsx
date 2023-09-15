import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { accountValueAtom, totalOpenRewardsAtom } from 'pages/portfolio-page/store/fetchPortfolio';
import { poolShareTokensUSDBalanceAtom } from 'pages/portfolio-page/store/fetchPoolShare';
import { poolTokensUSDBalanceAtom } from 'pages/portfolio-page/store/fetchPoolTokensUSDBalance';
import { leverageAtom, totalUnrealizedPnLAtom } from 'pages/portfolio-page/store/fetchUnrealizedPnL';

import { totalEstimatedEarningsAtom } from '../../store/fetchEarnings';
import styles from './AccountValue.module.scss';

const formatCurrency = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });

export const AccountValue = () => {
  const { t } = useTranslation();

  const [poolTokensUSDBalance] = useAtom(poolTokensUSDBalanceAtom);
  const [poolShareTokensUSDBalance] = useAtom(poolShareTokensUSDBalanceAtom);
  const [leverage] = useAtom(leverageAtom);
  const [totalUnrealizedPnL] = useAtom(totalUnrealizedPnLAtom);
  const [totalEstimatedEarnings] = useAtom(totalEstimatedEarningsAtom);
  const [totalReferralRewards] = useAtom(totalOpenRewardsAtom);
  const [accountValue] = useAtom(accountValueAtom);

  return (
    <div className={styles.sideBlock}>
      <div>
        <div className={styles.detailsHeader}>{t('pages.portfolio.account-value.title')}</div>
        <div className={styles.accountValue}>${formatCurrency(accountValue)}</div>
      </div>

      <div className={styles.detailsContainer}>
        <div className={styles.detailsHeader}>{t('pages.portfolio.account-value.details.wallet.title')}</div>
        <div className={styles.separator} />
        <div className={styles.detailsLine}>
          <div>{t('pages.portfolio.account-value.details.wallet.funds')}</div>
          <div className={styles.detailsValue}>${formatCurrency(poolTokensUSDBalance)}</div>
        </div>
      </div>
      <div className={styles.detailsContainer}>
        <div className={styles.detailsHeader}>{t('pages.portfolio.account-value.details.perps.title')}</div>
        <div className={styles.separator} />
        <div className={styles.detailsLine}>
          <div>{t('pages.portfolio.account-value.details.perps.leverage')}</div>
          <div className={styles.detailsValue}>{formatCurrency(leverage)}x</div>
        </div>
        <div className={styles.detailsLine}>
          <div>{t('pages.portfolio.account-value.details.perps.unrealized')}</div>
          <div className={styles.detailsValue}>
            {totalUnrealizedPnL < 0
              ? '-$' + formatCurrency(Math.abs(totalUnrealizedPnL))
              : '$' + formatCurrency(totalUnrealizedPnL)}
          </div>
        </div>
        <div className={styles.detailsLine}>
          <div>{t('pages.portfolio.account-value.details.perps.referral')}</div>
          <div className={styles.detailsValue}>${formatCurrency(totalReferralRewards)}</div>
        </div>
      </div>
      <div className={styles.detailsContainer}>
        <div className={styles.detailsHeader}>{t('pages.portfolio.account-value.details.vault.title')}</div>
        <div className={styles.separator} />
        <div className={styles.detailsLine}>
          <div>{t('pages.portfolio.account-value.details.vault.assets')}</div>
          <div className={styles.detailsValue}>${formatCurrency(poolShareTokensUSDBalance)}</div>
        </div>
        <div className={styles.detailsLine}>
          <div>{t('pages.portfolio.account-value.details.vault.total')}</div>
          <div className={styles.detailsValue}>${formatCurrency(totalEstimatedEarnings)}</div>
        </div>
      </div>
    </div>
  );
};

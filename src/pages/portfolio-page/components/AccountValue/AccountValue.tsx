import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

import { totalEstimatedEarningsAtom } from 'pages/portfolio-page/store/fetchEarnings';
import { accountValueAtom, totalOpenRewardsAtom } from 'pages/portfolio-page/store/fetchPortfolio';
import { poolShareTokensUSDBalanceAtom } from 'pages/portfolio-page/store/fetchPoolShare';
import { poolTokensUSDBalanceAtom } from 'pages/portfolio-page/store/fetchPoolTokensUSDBalance';
import { syntheticPositionUSDAtom } from 'pages/portfolio-page/store/fetchStrategySyntheticPosition';
import { leverageAtom, totalMarginAtom, totalUnrealizedPnLAtom } from 'pages/portfolio-page/store/fetchUnrealizedPnL';

import styles from './AccountValue.module.scss';

const formatCurrency = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });

export const AccountValue = () => {
  const { t } = useTranslation();

  const poolTokensUSDBalance = useAtomValue(poolTokensUSDBalanceAtom);
  const poolShareTokensUSDBalance = useAtomValue(poolShareTokensUSDBalanceAtom);
  const leverage = useAtomValue(leverageAtom);
  const totalMargin = useAtomValue(totalMarginAtom);
  const totalUnrealizedPnL = useAtomValue(totalUnrealizedPnLAtom);
  const syntheticPositionUSD = useAtomValue(syntheticPositionUSDAtom);
  const totalEstimatedEarnings = useAtomValue(totalEstimatedEarningsAtom);
  const totalReferralRewards = useAtomValue(totalOpenRewardsAtom);
  const accountValue = useAtomValue(accountValueAtom);

  return (
    <div className={styles.sideBlock}>
      <Typography variant="h5" className={styles.title}>
        {t('pages.portfolio.account-value.main-title')}
      </Typography>
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
          <div>{t('pages.portfolio.account-value.details.perps.margin-total')}</div>
          <div className={styles.detailsValue}>${formatCurrency(totalMargin)}</div>
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
      {syntheticPositionUSD !== null && (
        <div className={styles.detailsContainer}>
          <div className={styles.detailsHeader}>{t('pages.portfolio.account-value.details.strategies.title')}</div>
          <div className={styles.separator} />
          <div className={styles.detailsLine}>
            <div>{t('pages.portfolio.account-value.details.strategies.usd-position')}</div>
            <div className={styles.detailsValue}>${formatCurrency(syntheticPositionUSD)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

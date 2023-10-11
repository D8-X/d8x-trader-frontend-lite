import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Box } from '@mui/material';
import { poolsAtom } from 'store/pools.store';
import type { OverviewItemI, OverviewPoolItemI } from 'types/types';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { Overview } from '../overview/Overview';
import { ReferralCodeBlock } from '../referral-code-block/ReferralCodeBlock';
import { useFetchEarnedRebate } from '../referrer-tab/useFetchEarnedRebate';

import styles from './TraderTab.module.scss';
import { useFetchOpenRewards } from './useFetchOpenRewards';
import { useFetchCodeAndRebate } from './useFetchCodeAndRebate';

export const TraderTab = () => {
  const { t } = useTranslation();

  const [pools] = useAtom(poolsAtom);

  const { address } = useAccount();

  const getReferralCodesAsync = () => {};

  const disclaimerTextBlocks = useMemo(
    () => [t('pages.refer.trader-tab.disclaimer-text-block1'), t('pages.refer.trader-tab.disclaimer-text-block2')],
    [t]
  );

  const { activeCode, rebateRate } = useFetchCodeAndRebate();
  const { earnedRebates } = useFetchEarnedRebate();
  const { openRewards } = useFetchOpenRewards();

  const overviewItems: OverviewItemI[] = useMemo(() => {
    const earnedRebatesByPools: OverviewPoolItemI[] = [];
    const openRewardsByPools: OverviewPoolItemI[] = [];

    pools.forEach((pool) => {
      const earnedRebatesAmount = earnedRebates
        .filter((rebate) => rebate.poolId === pool.poolId)
        .reduce((accumulator, currentValue) => accumulator + currentValue.amountCC, 0);

      const openRewardsAmount = openRewards
        .filter((volume) => volume.poolId === pool.poolId)
        .reduce((accumulator, currentValue) => accumulator + currentValue.amountCC, 0);

      earnedRebatesByPools.push({ poolSymbol: pool.poolSymbol, value: earnedRebatesAmount });
      openRewardsByPools.push({ poolSymbol: pool.poolSymbol, value: openRewardsAmount });
    });

    return [
      {
        title: t('pages.refer.trader-tab.earned-rebates'),
        poolsItems: address ? earnedRebatesByPools : [],
      },
      {
        title: t('pages.refer.trader-tab.open-rewards'),
        poolsItems: address ? openRewardsByPools : [],
      },
    ];
  }, [pools, openRewards, earnedRebates, address, t]);

  return (
    <Box className={styles.root}>
      <Overview title={t('pages.refer.trader-tab.title1')} items={overviewItems} />
      <Disclaimer title={t('pages.refer.trader-tab.title2')} textBlocks={disclaimerTextBlocks} />
      <div className={styles.divider} />
      <ReferralCodeBlock
        referralCode={activeCode}
        traderRebatePercentage={rebateRate}
        onCodeApplySuccess={getReferralCodesAsync}
      />
    </Box>
  );
};

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { flatTokenAtom, poolsAtom } from 'store/pools.store';
import type { OverviewItemI, OverviewPoolItemI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { Overview } from '../overview/Overview';
import { ReferralCodeBlock } from '../referral-code-block/ReferralCodeBlock';
import { useFetchEarnedRebate } from '../referrer-tab/useFetchEarnedRebate';
import { useFetchOpenRewards } from './useFetchOpenRewards';
import { useFetchCodeAndRebate } from './useFetchCodeAndRebate';

import styles from './TraderTab.module.scss';

export const TraderTab = () => {
  const { t } = useTranslation();

  const pools = useAtomValue(poolsAtom);
  const flatToken = useAtomValue(flatTokenAtom);

  const { address, chainId } = useAccount();

  const disclaimerTextBlocks = useMemo(
    () => [t('pages.refer.trader-tab.disclaimer-text-block1'), t('pages.refer.trader-tab.disclaimer-text-block2')],
    [t]
  );

  const { activeCode, rebateRate, fetchCodeAndRebate } = useFetchCodeAndRebate();
  const { earnedRebates } = useFetchEarnedRebate();
  const { openRewards } = useFetchOpenRewards();

  const overviewItems: OverviewItemI[] = useMemo(() => {
    const earnedRebatesByPools: OverviewPoolItemI[] = [];
    const openEarningsByPools: OverviewPoolItemI[] = [];

    pools.forEach((pool) => {
      const earnedRebatesAmount = earnedRebates
        .filter((rebate) => rebate.asTrader && rebate.poolId === pool.poolId)
        .reduce((accumulator, currentValue) => accumulator + currentValue.earnings, 0);

      const openEarningsAmount = openRewards
        .filter((volume) => volume.poolId === pool.poolId)
        .reduce((accumulator, currentValue) => accumulator + currentValue.earnings, 0);

      const [userPrice, userSymbol] =
        !!flatToken && pool.poolId === flatToken.poolId && !!flatToken.registeredSymbol
          ? [flatToken.compositePrice ?? 1, flatToken.registeredSymbol]
          : [1, pool.settleSymbol];

      earnedRebatesByPools.push({
        symbol: userSymbol,
        value: earnedRebatesAmount * userPrice,
      });
      openEarningsByPools.push({
        symbol: userSymbol,
        value: openEarningsAmount * userPrice,
      });
    });

    return [
      {
        title: t('pages.refer.trader-tab.earned-rebates'),
        poolsItems: address && isEnabledChain(chainId) ? earnedRebatesByPools : [],
      },
      {
        title: t('pages.refer.trader-tab.open-rewards'),
        poolsItems: address && isEnabledChain(chainId) ? openEarningsByPools : [],
      },
    ];
  }, [flatToken, pools, openRewards, earnedRebates, address, chainId, t]);

  return (
    <div className={styles.root}>
      <Overview title={t('pages.refer.trader-tab.title1')} items={overviewItems} />
      <Disclaimer title={t('pages.refer.trader-tab.title2')} textBlocks={disclaimerTextBlocks} />
      <div className={styles.divider} />
      <ReferralCodeBlock
        referralCode={activeCode}
        traderRebatePercentage={rebateRate}
        onCodeApplySuccess={fetchCodeAndRebate}
      />
    </div>
  );
};

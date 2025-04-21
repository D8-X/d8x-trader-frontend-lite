// src/pages/leaderboard-page/LeaderboardPage.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Container } from '@mui/material';

import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { getAllTimeLeaderboardEntries, getWeeklyLeaderboardEntries } from 'network/network';
import { AllTimeLeaderboardEntryI, UserLeaderboardStatsI, WeeklyLeaderboardEntryI } from 'types/types';

import { LeaderboardTable } from './components/leaderboard-table/LeaderboardTable';
import { LeaderboardTabIdE } from './constants';
import { TabSelector } from './components/tab-selector/TabSelector';
import { UserStats } from './components/user-stats/UserStats';
import styles from './LeaderboardPage.module.scss';

export const LeaderboardPage = () => {
  const { t } = useTranslation();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<LeaderboardTabIdE>(LeaderboardTabIdE.Weekly);
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyLeaderboardEntryI[]>([]);
  const [allTimeEntries, setAllTimeEntries] = useState<AllTimeLeaderboardEntryI[]>([]);
  const [weeklyUserStats, setWeeklyUserStats] = useState<UserLeaderboardStatsI | null>(null);
  const [allTimeUserStats, setAllTimeUserStats] = useState<UserLeaderboardStatsI | null>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [isLoadingAllTime, setIsLoadingAllTime] = useState(false);
  const [isUserStatsLoading, setIsUserStatsLoading] = useState(true);
  const [allWeeklyEntries, setAllWeeklyEntries] = useState<WeeklyLeaderboardEntryI[]>([]);
  const [allAllTimeEntries, setAllAllTimeEntries] = useState<AllTimeLeaderboardEntryI[]>([]);
  const [weeklyPage, setWeeklyPage] = useState(0);
  const [allTimePage, setAllTimePage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [allTimeAsOfDate, setAllTimeAsOfDate] = useState<string | null>(null);

  // Fetch weekly leaderboard data
  const fetchWeeklyLeaderboardData = async (page = 0) => {
    setIsLoadingWeekly(true);
    try {
      const data = await getWeeklyLeaderboardEntries();
      // Handle API response format with 'leaderBoard' field (weekly endpoint specific)
      if (data && data.leaderBoard && Array.isArray(data.leaderBoard)) {
        // Sort by volume (descending) and assign new ranks
        const sortedByVolume = [...data.leaderBoard]
          .sort((a, b) => (b.vol || 0) - (a.vol || 0))
          .map((entry, index) => ({
            ...entry,
            volumeRank: index + 1,
          }));

        setAllWeeklyEntries(sortedByVolume);
        setWeeklyEntries(sortedByVolume.slice(page * pageSize, (page + 1) * pageSize));
        console.log('sortedByVolume', sortedByVolume);
        console.log('weeklyEntries', weeklyEntries);
      } else {
        console.error('Weekly leaderboard API returned unexpected data format:', data);
        setAllWeeklyEntries([]);
        setWeeklyEntries([]);
      }
    } catch (error) {
      console.error('Error fetching weekly leaderboard data:', error);
      setAllWeeklyEntries([]);
      setWeeklyEntries([]);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  // Fetch all-time leaderboard data
  const fetchAllTimeLeaderboardData = async (page = 0) => {
    setIsLoadingAllTime(true);
    try {
      const data = await getAllTimeLeaderboardEntries();
      // Handle API response format with 'board' field instead of 'entries'
      if (data && data.board && Array.isArray(data.board)) {
        // Sort by points (descending) and assign ranks
        const sortedEntries = [...data.board]
          .sort((a, b) => (b.points || 0) - (a.points || 0))
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));
        setAllAllTimeEntries(sortedEntries);
        setAllTimeEntries(sortedEntries.slice(page * pageSize, (page + 1) * pageSize));
        setAllTimeAsOfDate(data.asOfDate);
      } else {
        console.error('All-time leaderboard API returned unexpected data format:', data);
        setAllAllTimeEntries([]);
        setAllTimeEntries([]);
      }
    } catch (error) {
      console.error('Error fetching all-time leaderboard data:', error);
      setAllAllTimeEntries([]);
      setAllTimeEntries([]);
    } finally {
      setIsLoadingAllTime(false);
    }
  };

  // Effect to extract user stats from leaderboard data when user is connected
  useEffect(() => {
    if (!address) {
      setWeeklyUserStats(null);
      setAllTimeUserStats(null);
      setIsUserStatsLoading(false);
      return;
    }

    setIsUserStatsLoading(true);

    // Find weekly stats
    if (allWeeklyEntries.length > 0) {
      const userEntry = allWeeklyEntries.find(
        (entry) =>
          entry.trader?.toLowerCase() === address.toLowerCase() ||
          entry.address?.toLowerCase() === address.toLowerCase()
      );

      if (userEntry) {
        setWeeklyUserStats({
          rank: userEntry.rank || 0,
          trader: userEntry.trader || userEntry.address || address,
          pnl: userEntry.pnl || 0,
        });
      } else {
        setWeeklyUserStats({
          rank: 0,
          trader: address,
          pnl: 0,
        });
      }
    }

    // Find all-time stats
    if (allAllTimeEntries.length > 0) {
      const userEntry = allAllTimeEntries.find((entry) => entry.address?.toLowerCase() === address.toLowerCase());

      if (userEntry) {
        setAllTimeUserStats({
          rank: userEntry.rank || 0,
          trader: userEntry.address || address,
          points: userEntry.points || 0,
          numWeeks: userEntry.numWeeks,
          pnl: userEntry.pnl || 0,
        });
      } else {
        setAllTimeUserStats({
          rank: 0,
          trader: address,
          points: 0,
          numWeeks: 0,
          pnl: 0,
        });
      }
    }

    setIsUserStatsLoading(false);
  }, [address, allWeeklyEntries, allAllTimeEntries]);

  // Handle tab change
  const handleTabChange = (tab: LeaderboardTabIdE) => {
    setActiveTab(tab);
  };

  // Handle page change for weekly leaderboard
  const handleWeeklyPageChange = (page: number) => {
    setWeeklyPage(page);
    setWeeklyEntries(allWeeklyEntries.slice(page * pageSize, (page + 1) * pageSize));
  };

  // Handle page change for all-time leaderboard
  const handleAllTimePageChange = (page: number) => {
    setAllTimePage(page);
    setAllTimeEntries(allAllTimeEntries.slice(page * pageSize, (page + 1) * pageSize));
  };

  // Handle page size change for weekly leaderboard
  const handleWeeklyPageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setWeeklyPage(0); // Reset to first page
    setWeeklyEntries(allWeeklyEntries.slice(0, newPageSize));
  };

  // Handle page size change for all-time leaderboard
  const handleAllTimePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setAllTimePage(0); // Reset to first page
    setAllTimeEntries(allAllTimeEntries.slice(0, newPageSize));
  };

  // Initial data fetch
  useEffect(() => {
    fetchWeeklyLeaderboardData();
    fetchAllTimeLeaderboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MaintenanceWrapper>
      <Helmet title={t('pages.leaderboard.title')} />
      <Container className={styles.container}>
        <div>
          <div className={styles.imageBanner}>
            <img
              src="/images/boost-station/bannerTradingCompetition.png"
              alt="Competition"
              className={styles.bannerImage}
            />
          </div>

          <TabSelector activeTab={activeTab} onTabChange={handleTabChange} />

          <div className={styles.userStatsContainer}>
            {address && (
              <UserStats
                weeklyStats={weeklyUserStats}
                allTimeStats={allTimeUserStats}
                isLoading={isUserStatsLoading}
                allTimeAsOfDate={allTimeAsOfDate}
                activeTab={activeTab}
              />
            )}
          </div>
          {activeTab === LeaderboardTabIdE.Weekly ? (
            <LeaderboardTable
              entries={weeklyEntries}
              isLoading={isLoadingWeekly}
              isWeekly={true}
              paginationMetadata={{
                totalEntries: allWeeklyEntries.length,
                totalPages: Math.ceil(allWeeklyEntries.length / pageSize),
                currentPage: weeklyPage,
                pageSize,
                hasNextPage: weeklyPage < Math.ceil(allWeeklyEntries.length / pageSize) - 1,
                hasPreviousPage: weeklyPage > 0,
              }}
              onPageChange={handleWeeklyPageChange}
              onPageSizeChange={handleWeeklyPageSizeChange}
            />
          ) : (
            <LeaderboardTable
              entries={allTimeEntries}
              isLoading={isLoadingAllTime}
              isWeekly={false}
              paginationMetadata={{
                totalEntries: allAllTimeEntries.length,
                totalPages: Math.ceil(allAllTimeEntries.length / pageSize),
                currentPage: allTimePage,
                pageSize,
                hasNextPage: allTimePage < Math.ceil(allAllTimeEntries.length / pageSize) - 1,
                hasPreviousPage: allTimePage > 0,
              }}
              onPageChange={handleAllTimePageChange}
              onPageSizeChange={handleAllTimePageSizeChange}
            />
          )}
        </div>
      </Container>
    </MaintenanceWrapper>
  );
};

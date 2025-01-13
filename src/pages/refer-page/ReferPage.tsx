import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type Address, erc20Abi } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { useQuery } from 'hooks/useQuery';
import { getMyReferrals, getReferCut, getTokenInfo } from 'network/referral';
import {
  commissionRateAtom,
  isAgencyAtom,
  referralCodesAtom,
  referralCodesRefetchHandlerRefAtom,
  tokenInfoAtom,
} from 'store/refer.store';
import { isEnabledChain } from 'utils/isEnabledChain';

import { ReferrerTab } from './components/referrer-tab/ReferrerTab';
import { TabSelector } from './components/tab-selector/TabSelector';
import { TraderTab } from './components/trader-tab/TraderTab';
import { QueryParamE, ReferTabIdE } from './constants';

import styles from './ReferPage.module.scss';

const tabComponents = [
  {
    tabId: ReferTabIdE.Trader,
    content: <TraderTab key={ReferTabIdE.Trader} />,
  },
  {
    tabId: ReferTabIdE.Referral,
    content: <ReferrerTab key={ReferTabIdE.Referral} />,
  },
];

const queryParamToReferTabIdMap: Record<string, ReferTabIdE> = {
  trader: ReferTabIdE.Trader,
  referral: ReferTabIdE.Referral,
};

export const ReferPage = () => {
  const [activeTabId, setActiveTabId] = useState(ReferTabIdE.Trader);

  const [tokenInfo, setTokenInfo] = useAtom(tokenInfoAtom);
  const setIsAgency = useSetAtom(isAgencyAtom);
  const setCommissionRate = useSetAtom(commissionRateAtom);
  const setReferralCodes = useSetAtom(referralCodesAtom);
  const setReferralCodesRefetchHandler = useSetAtom(referralCodesRefetchHandlerRefAtom);

  const { address, isConnected, chainId } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  const query = useQuery();

  const tokenInfoRequestRef = useRef(false);
  const referralCodesRequestRef = useRef(false);
  const isAgencyRequestRef = useRef(false);

  const { data: tokenBalance } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: tokenInfo?.tokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: tokenInfo?.tokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: { enabled: address && isEnabledChain(chainId) && !!tokenInfo?.tokenAddr && isConnected },
  });

  const handleTabChange = useCallback(
    (tabId: ReferTabIdE) => {
      setActiveTabId(tabId);

      query.set(QueryParamE.Tab, tabId);

      const newQuery = query.toString();
      const paramsStr = newQuery ? `?${newQuery}` : '';

      navigate(`${location.pathname}${paramsStr}${location.hash}`);
    },
    [navigate, location, query]
  );

  const refreshReferralCodes = useCallback(() => {
    if (referralCodesRequestRef.current || !isEnabledChain(chainId) || !address) {
      return;
    }

    referralCodesRequestRef.current = true;

    getMyReferrals(chainId, address)
      .then(({ data }) => {
        setReferralCodes(data);
      })
      .catch(console.error)
      .finally(() => {
        referralCodesRequestRef.current = false;
      });
  }, [address, chainId, setReferralCodes]);

  useEffect(() => {
    setReferralCodesRefetchHandler({ handleRefresh: refreshReferralCodes });

    return () => {
      referralCodesRequestRef.current = false;
    };
  }, [refreshReferralCodes, setReferralCodesRefetchHandler]);

  useEffect(() => {
    refreshReferralCodes();
  }, [refreshReferralCodes]);

  useEffect(() => {
    if (tokenInfoRequestRef.current || !isEnabledChain(chainId)) {
      return;
    }

    tokenInfoRequestRef.current = true;

    getTokenInfo(chainId)
      .then(({ data }) => setTokenInfo(data))
      .catch(console.error)
      .finally(() => {
        tokenInfoRequestRef.current = false;
      });

    return () => {
      tokenInfoRequestRef.current = false;
    };
  }, [chainId, setTokenInfo]);

  useEffect(() => {
    if (isAgencyRequestRef.current || !isEnabledChain(chainId) || !address || tokenBalance === undefined) {
      return;
    }

    isAgencyRequestRef.current = true;

    getReferCut(chainId, address, tokenBalance[0])
      .then(({ data }) => {
        setIsAgency(data.isAgency);
        setCommissionRate(data.passed_on_percent);
      })
      .catch(console.error)
      .finally(() => {
        isAgencyRequestRef.current = false;
      });

    return () => {
      isAgencyRequestRef.current = false;
    };
  }, [chainId, address, tokenBalance, setIsAgency, setCommissionRate]);

  useEffect(() => {
    const tabId = query.get(QueryParamE.Tab);
    if (!tabId) {
      return;
    }

    const referTabId = queryParamToReferTabIdMap[tabId];
    if (!referTabId) {
      return;
    }

    setActiveTabId(referTabId);
  }, [query]);

  return (
    <>
      <Helmet title="Refer | D8X App" />
      <div className={styles.root}>
        <MaintenanceWrapper>
          <Container className={styles.container}>
            <TabSelector activeTab={activeTabId} onTabChange={handleTabChange} />
            {tabComponents.find(({ tabId }) => tabId === activeTabId)?.content}
          </Container>
        </MaintenanceWrapper>
      </div>
    </>
  );
};

import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Container } from 'components/container/Container';
import { useFetchOpenRewards } from 'pages/refer-page/components/trader-tab/useFetchOpenRewards';
import { traderAPIAtom } from 'store/pools.store';

import styles from './PortfolioPage.module.scss';
import { AccountValue } from './components/AccountValue/AccountValue';
import { AssetsBlock } from './components/AssetsBlock/AssetsBlock';
import { fetchPortfolioAtom } from './store/fetchPortfolio';

export const PortfolioPage = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { openRewards } = useFetchOpenRewards();
  const [traderAPI] = useAtom(traderAPIAtom);
  const fetchPortfolio = useSetAtom(fetchPortfolioAtom);

  useEffect(() => {
    if (traderAPI) {
      // eslint-disable-next-line
      fetchPortfolio(address!, chainId, openRewards);
    }
  }, [openRewards, traderAPI, address, chainId, fetchPortfolio]);

  return (
    <div className={styles.root}>
      <Container>
        <div className={styles.container}>
          <AccountValue />
          <AssetsBlock />
        </div>
      </Container>
    </div>
  );
};

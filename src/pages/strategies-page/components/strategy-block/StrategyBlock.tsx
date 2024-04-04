import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { hasPositionAtom, strategyAddressesAtom } from 'store/strategies.store';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { EnterStrategy } from '../enter-strategy/EnterStrategy';
import { ExitStrategy } from '../exit-strategy/ExitStrategy';
import { Overview } from '../overview/Overview';

import styles from './StrategyBlock.module.scss';
import { getPositionRisk } from 'network/network';
import { useAccount, useChainId } from 'wagmi';
import { STRATEGY_SYMBOL } from 'appConstants';

export const StrategyBlock = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address } = useAccount();

  const [hasPosition, setHasPosition] = useAtom(hasPositionAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);

  const disclaimerTextBlocks = useMemo(() => [t('pages.strategies.info.text1'), t('pages.strategies.info.text2')], [t]);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  useEffect(() => {
    if (!strategyAddress) {
      return;
    }

    getPositionRisk(chainId, null, strategyAddress).then(({ data: positions }) => {
      setHasPosition(
        positions &&
          positions.some(
            ({ symbol, positionNotionalBaseCCY }) => symbol === STRATEGY_SYMBOL && positionNotionalBaseCCY !== 0
          )
      );
    });
  }, [chainId, strategyAddress, setHasPosition]);

  return (
    <div className={styles.root}>
      <Overview />
      <div className={styles.actionBlock}>
        <Disclaimer title={t('pages.strategies.info.title')} textBlocks={disclaimerTextBlocks} />
        <div className={styles.divider} />
        {hasPosition === null && <div className={styles.emptyBlock} />}
        {hasPosition === true && <ExitStrategy />}
        {hasPosition === false && <EnterStrategy />}
      </div>
    </div>
  );
};

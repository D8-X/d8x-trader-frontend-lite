import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { hasPositionAtom } from 'store/strategies.store';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { EnterStrategy } from '../enter-strategy/EnterStrategy';
import { ExitStrategy } from '../exit-strategy/ExitStrategy';
import { Overview } from '../overview/Overview';

import styles from './StrategyBlock.module.scss';

export const StrategyBlock = () => {
  const { t } = useTranslation();

  const [hasPosition, setHasPosition] = useAtom(hasPositionAtom);

  const disclaimerTextBlocks = useMemo(() => [t('pages.strategies.info.text1'), t('pages.strategies.info.text2')], [t]);

  // FIXME: Should be removed or replaced later
  useEffect(() => {
    setTimeout(() => {
      setHasPosition(false);
    }, 1000);
  }, [setHasPosition]);

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

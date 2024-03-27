import { useAtom } from 'jotai';

import DarkBackgroundSvg from 'assets/pnl-poster/darkBackground.svg?react';
import LightBackgroundSvg from 'assets/pnl-poster/lightBackground.svg?react';
import { enabledDarkModeAtom } from 'store/app.store';

import styles from './ShareModal.module.scss';

export const Background = () => {
  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);

  return (
    <div className={styles.backgroundContainer}>{enabledDarkMode ? <DarkBackgroundSvg /> : <LightBackgroundSvg />}</div>
  );
};

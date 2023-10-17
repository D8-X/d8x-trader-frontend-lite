import { useAtom } from 'jotai';

import { enabledDarkModeAtom } from 'store/app.store';

import DarkmodeBackground from './darkmode.png';
import LightmodeBackground from './lightmode.png';
import styles from './ShareModal.module.scss';

export const Background = () => {
  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);

  return (
    <img
      src={enabledDarkMode ? DarkmodeBackground : LightmodeBackground}
      className={styles.backgroundImage}
      alt="stats background"
    />
  );
};

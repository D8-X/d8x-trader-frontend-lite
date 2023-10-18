import { useAtom } from 'jotai';

import { enabledDarkModeAtom } from 'store/app.store';

import { ReactComponent as DarkBackgroundSvg } from './DarkBackground.svg';
import { ReactComponent as LightBackgroundSvg } from './LightBackground.svg';
import styles from './ShareModal.module.scss';

export const Background = () => {
  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);

  return (
    <div className={styles.backgroundContainer}>{enabledDarkMode ? <DarkBackgroundSvg /> : <LightBackgroundSvg />}</div>
  );
};

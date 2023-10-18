import { useAtom } from 'jotai';

import { enabledDarkModeAtom } from 'store/app.store';

import { ReactComponent as DarkBackgroundSvg } from 'assets/pnlposter/darkBackground.svg';
import { ReactComponent as LightBackgroundSvg } from 'assets/pnlposter/lightBackground.svg';
import styles from './ShareModal.module.scss';

export const Background = () => {
  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);

  return (
    <div className={styles.backgroundContainer}>{enabledDarkMode ? <DarkBackgroundSvg /> : <LightBackgroundSvg />}</div>
  );
};

import classnames from 'classnames';
import { useAtom } from 'jotai';

import DarkMode from 'assets/icons/new/darkMode.svg?react';
import LightMode from 'assets/icons/new/lightMode.svg?react';

import { enabledDarkModeAtom } from 'store/app.store';

import styles from './ThemeSwitcher.module.scss';

export const ThemeSwitcher = () => {
  const [enabledDarkMode, setEnabledDarkMode] = useAtom(enabledDarkModeAtom);

  const toggleTheme = () => {
    setEnabledDarkMode(!enabledDarkMode);
  };

  return (
    <div className={classnames(styles.root, { [styles.isDark]: enabledDarkMode })} onClick={toggleTheme}>
      <LightMode />
      <DarkMode />
      <div className={styles.overlay}></div>
    </div>
  );
};

import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import Flag from 'react-world-flags';

import { MenuItem } from '@mui/material';

import type { LanguageMetaI } from 'types/types';

import styles from './LanguageSwitcherMenuItem.module.scss';

export interface LanguageSwitcherMenuItemPropsI {
  languageMeta: LanguageMetaI;
  onClick?: () => void;
}

export const LanguageSwitcherMenuItem = ({ languageMeta, onClick }: LanguageSwitcherMenuItemPropsI) => {
  const { i18n } = useTranslation();

  return (
    <MenuItem
      key={languageMeta.id}
      onClick={() => {
        const lang = languageMeta.id;
        i18n.changeLanguage(lang);
        onClick?.();
      }}
      className={classnames(styles.menuItem, { [styles.selected]: i18n.resolvedLanguage === languageMeta.lang })}
    >
      <Flag code={languageMeta.flag} width="20" height="16" className={styles.flagIcon} />
      {languageMeta.name}
    </MenuItem>
  );
};

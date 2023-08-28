import classnames from 'classnames';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Flag from 'react-world-flags';

import { MenuItem } from '@mui/material';

import { selectedLanguageAtom } from 'store/app.store';
import { LanguageE } from 'types/enums';
import type { LanguageMetaI } from 'types/types';

import styles from './LanguageSwitcherMenuItem.module.scss';

export interface LanguageSwitcherMenuItemPropsI {
  languageMeta: LanguageMetaI;
  onClick?: () => void;
}

export const LanguageSwitcherMenuItem = ({ languageMeta, onClick }: LanguageSwitcherMenuItemPropsI) => {
  const [selectedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom);
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    (lang: LanguageE) => {
      setSelectedLanguage(lang);
      i18n.changeLanguage(lang).then();
    },
    [i18n, setSelectedLanguage]
  );

  return (
    <MenuItem
      key={languageMeta.id}
      onClick={() => {
        changeLanguage(languageMeta.id);
        if (onClick) {
          onClick();
        }
      }}
      className={classnames('notranslate', { [styles.selected]: selectedLanguage === languageMeta.lang })}
    >
      <Flag code={languageMeta.flag} width="20" height="16" className={styles.flagIcon} />
      {languageMeta.name}
    </MenuItem>
  );
};

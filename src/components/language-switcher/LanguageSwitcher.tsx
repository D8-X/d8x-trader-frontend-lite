import classnames from 'classnames';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LanguageIcon from 'assets/languageSelector.svg?react';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { LanguageE } from 'types/enums';
import type { LanguageMetaI } from 'types/types';

import { LanguageSwitcherMenuItem } from './elements/LanguageSwitcherMenuItem';

function createLandObject(id: LanguageE, name: string, flag?: string) {
  return {
    id,
    lang: id,
    flag: flag || id,
    name,
  };
}

const languageMetaMap: Record<LanguageE, LanguageMetaI> = {
  [LanguageE.EN]: createLandObject(LanguageE.EN, 'English', 'us'),
  [LanguageE.CN]: createLandObject(LanguageE.CN, '中文'),
  [LanguageE.DE]: createLandObject(LanguageE.DE, 'Deutsch'),
  [LanguageE.ES]: createLandObject(LanguageE.ES, 'Español'),
  [LanguageE.FR]: createLandObject(LanguageE.FR, 'Français'),
};

import styles from './LanguageSwitcher.module.scss';

interface LanguageSwitcherPropsI {
  isMini?: boolean;
}

export const LanguageSwitcher = ({ isMini = false }: LanguageSwitcherPropsI) => {
  const { i18n } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const selectedLanguageMeta =
    languageMetaMap[(i18n.resolvedLanguage as LanguageE) || LanguageE.EN] || languageMetaMap[LanguageE.EN];

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <DropDownSelect
      id="order-block-dropdown"
      selectedValue={
        isMini ? (
          selectedLanguageMeta.lang.toUpperCase()
        ) : (
          <>
            <LanguageIcon /> {selectedLanguageMeta.name}
          </>
        )
      }
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      fullWidth
      hasArrow={!isMini}
      className={classnames({ [styles.miniButton]: isMini })}
    >
      {Object.entries(LanguageE).map(([key, lang]) => (
        <LanguageSwitcherMenuItem languageMeta={languageMetaMap[lang]} key={key} onClick={handleClose} />
      ))}
    </DropDownSelect>
  );
};

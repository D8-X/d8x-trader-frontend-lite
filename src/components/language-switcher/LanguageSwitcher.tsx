import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LanguageIcon } from 'assets/languageSelector.svg';
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
};

export const LanguageSwitcher = () => {
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
        <>
          <LanguageIcon /> {selectedLanguageMeta.name}
        </>
      }
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      fullWidth
    >
      {Object.entries(LanguageE).map(([key, lang]) => (
        <LanguageSwitcherMenuItem languageMeta={languageMetaMap[lang]} key={key} onClick={handleClose} />
      ))}
    </DropDownSelect>
  );
};

import { useAtom } from 'jotai';
import { type MouseEvent, useState } from 'react';

import { Button, Menu } from '@mui/material';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';

import { ReactComponent as LanguageIcon } from 'assets/languageSelector.svg';
import { selectedLanguageAtom } from 'store/app.store';
import { LanguageE } from 'types/enums';
import type { LanguageMetaI } from 'types/types';

import { LanguageSwitcherMenuItem } from './elements/LanguageSwitcherMenuItem';

import styles from './LanguageSwitcher.module.scss';

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
  const [selectedLanguage] = useAtom(selectedLanguageAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const selectedLanguageMeta = languageMetaMap[selectedLanguage];

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button onClick={handleClick} className={styles.languageButton} variant="outlined">
        <div className={styles.selectedLanguage}>
          <LanguageIcon /> {selectedLanguageMeta.name}
        </div>
        <div className={styles.arrowDropDown}>{open ? <ArrowDropUp /> : <ArrowDropDown />}</div>
      </Button>
      <Menu
        anchorEl={anchorEl}
        id="dropdown-language"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {Object.entries(LanguageE).map(([key, lang]) => (
          <LanguageSwitcherMenuItem languageMeta={languageMetaMap[lang]} key={key} onClick={handleClose} />
        ))}
      </Menu>
    </>
  );
};

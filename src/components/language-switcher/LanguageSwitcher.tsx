import { type MouseEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Menu, Tooltip } from '@mui/material';

import { ReactComponent as LanguageIcon } from 'assets/languageSelector.svg';
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
};

export const LanguageSwitcher = () => {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title={t('common.change-language')}>
        <Button onClick={handleClick} className={styles.iconButton} variant="primary">
          <LanguageIcon />
        </Button>
      </Tooltip>
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

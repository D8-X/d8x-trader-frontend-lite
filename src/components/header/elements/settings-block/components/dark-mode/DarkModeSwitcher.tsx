import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { enabledDarkModeAtom } from 'store/app.store';

const optionsArray = [true, false];

export const DarkModeSwitcher = () => {
  const { t } = useTranslation();

  const [enabledDarkMode, setEnabledDarkMode] = useAtom(enabledDarkModeAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <DropDownSelect
      id="dark-mode-dropdown"
      selectedValue={t(`common.settings.ui-settings.dark-mode.${enabledDarkMode ? 'on' : 'off'}`)}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    >
      {optionsArray.map((option) => (
        <DropDownMenuItem
          key={String(option)}
          option={t(`common.settings.ui-settings.dark-mode.${option ? 'on' : 'off'}`)}
          isActive={option === enabledDarkMode}
          onClick={() => {
            setEnabledDarkMode(option);
            setAnchorEl(null);
          }}
        />
      ))}
    </DropDownSelect>
  );
};

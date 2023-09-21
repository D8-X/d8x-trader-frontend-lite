import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { defaultCurrencyAtom } from 'store/app.store';
import { DefaultCurrencyE } from 'types/enums';

const optionsArray = Object.values(DefaultCurrencyE);

export const DefaultCurrencySelect = () => {
  const { t } = useTranslation();

  const [defaultCurrency, setDefaultCurrency] = useAtom(defaultCurrencyAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <DropDownSelect
      id="default-curency-dropdown"
      selectedValue={t(`common.settings.ui-settings.default-currency.${defaultCurrency}`)}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    >
      {optionsArray.map((option) => (
        <DropDownMenuItem
          key={option}
          option={t(`common.settings.ui-settings.default-currency.${option}`)}
          isActive={option === defaultCurrency}
          onClick={() => {
            setDefaultCurrency(option);
            setAnchorEl(null);
          }}
        />
      ))}
    </DropDownSelect>
  );
};

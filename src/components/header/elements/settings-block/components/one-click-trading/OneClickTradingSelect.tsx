import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { enabledOneClickTradingAtom } from 'store/app.store';

const optionsArray = [true, false];

export const OneClickTradingSelect = () => {
  const { t } = useTranslation();

  const { isDisconnected } = useAccount();

  const [enabledOneClickTrading, setEnabledOneClickTrading] = useAtom(enabledOneClickTradingAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <DropDownSelect
      id="one-click-trading-dropdown"
      selectedValue={t(`common.settings.ui-settings.conditional-options.${enabledOneClickTrading ? 'on' : 'off'}`)}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      disabled={isDisconnected}
    >
      {optionsArray.map((option) => (
        <DropDownMenuItem
          key={String(option)}
          option={t(`common.settings.ui-settings.conditional-options.${option ? 'on' : 'off'}`)}
          isActive={option === enabledOneClickTrading}
          onClick={() => {
            setEnabledOneClickTrading(option);
            setAnchorEl(null);
          }}
        />
      ))}
    </DropDownSelect>
  );
};

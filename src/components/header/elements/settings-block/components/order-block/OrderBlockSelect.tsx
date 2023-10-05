import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { orderBlockPositionAtom } from 'store/app.store';
import { OrderBlockPositionE } from 'types/enums';

const optionsArray = Object.values(OrderBlockPositionE);

export const OrderBlockSelect = () => {
  const { t } = useTranslation();

  const [orderBlockPosition, setOrderBlockPosition] = useAtom(orderBlockPositionAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <DropDownSelect
      id="order-block-dropdown"
      selectedValue={t(`common.settings.ui-settings.order-block.${orderBlockPosition}`)}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    >
      {optionsArray.map((option) => (
        <DropDownMenuItem
          key={option}
          option={t(`common.settings.ui-settings.order-block.${option}`)}
          isActive={option === orderBlockPosition}
          onClick={() => {
            setOrderBlockPosition(option);
            setAnchorEl(null);
          }}
        />
      ))}
    </DropDownSelect>
  );
};

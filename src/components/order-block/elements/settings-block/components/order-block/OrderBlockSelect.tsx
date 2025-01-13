import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonSelect } from 'components/button-select/ButtonSelect';
import { ButtonMenuItem } from 'components/button-select/elements/ButtonMenuItem';
import { orderBlockPositionAtom } from 'store/app.store';
import { OrderBlockPositionE } from 'types/enums';

import styles from './OrderBlockSelect.module.scss';

const optionsArray = Object.values(OrderBlockPositionE);

export const OrderBlockSelect = () => {
  const { t } = useTranslation();

  const [orderBlockPosition, setOrderBlockPosition] = useAtom(orderBlockPositionAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <ButtonSelect
      id="order-block-select"
      selectedValue={
        <span className={styles.value}>{t(`common.settings.ui-settings.order-block.${orderBlockPosition}`)}</span>
      }
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    >
      {optionsArray.map((option) => (
        <ButtonMenuItem
          key={option}
          option={t(`common.settings.ui-settings.order-block.${option}`)}
          isActive={option === orderBlockPosition}
          onClick={() => {
            setOrderBlockPosition(option);
            setAnchorEl(null);
          }}
        />
      ))}
    </ButtonSelect>
  );
};

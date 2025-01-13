import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonSelect } from 'components/button-select/ButtonSelect';
import { ButtonMenuItem } from 'components/button-select/elements/ButtonMenuItem';
import { reduceOnlyAtom } from 'store/order-block.store';
import { YesNoE } from 'types/enums';

import styles from './ReduceOnlySelector.module.scss';

const optionsArray = Object.values(YesNoE);
const yesNoMap: Record<YesNoE, boolean> = {
  [YesNoE.Yes]: true,
  [YesNoE.No]: false,
};

export const ReduceOnlySelector = () => {
  const { t } = useTranslation();

  const [reduceOnly, setReduceOnly] = useAtom(reduceOnlyAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const reduceOnlyEnum = reduceOnly ? YesNoE.Yes : YesNoE.No;

  return (
    <ButtonSelect
      id="reduce-only-selector"
      selectedValue={<span className={styles.value}>{t(`common.${reduceOnlyEnum}`)}</span>}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    >
      {optionsArray.map((option) => (
        <ButtonMenuItem
          key={option}
          option={t(`common.${option}`)}
          isActive={option === reduceOnlyEnum}
          onClick={() => {
            setReduceOnly(yesNoMap[option]);
            setAnchorEl(null);
          }}
        />
      ))}
    </ButtonSelect>
  );
};

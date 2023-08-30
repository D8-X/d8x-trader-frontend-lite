import { FC, MouseEventHandler } from 'react';

import { tokensIconsMap } from 'utils/tokens';
import styles from './Select.module.scss';

const CollateralOption = ({
  collateral,
  onClick,
}: {
  collateral: string;
  onClick: MouseEventHandler<HTMLOptionElement>;
}) => {
  const IconComponent = tokensIconsMap[collateral.toLowerCase()]?.icon ?? tokensIconsMap.default.icon;

  return (
    <option className={styles.collateralOptionContainer} value={collateral} onClick={onClick}>
      <IconComponent width={24} height={24} />
      {collateral}
    </option>
  );
};

type SelectOptionT = string;

type OnSelectFnT = (value: SelectOptionT, index: number) => void;

export interface SelectPropsI {
  options: SelectOptionT[];
  defaultValueIndex?: number;
  onSelect: OnSelectFnT;
}

export const Select: FC<SelectPropsI> = ({ options, onSelect }) => {
  // const [isOpen, setIsOpen] = useState(false);
  // const [currentValueIndex, setCurrentValueIndex] = useState(defaultValueIndex || 0);

  const setSelectValue = (newValue: SelectOptionT, i: number) => {
    // setIsOpen(false);
    // setCurrentValueIndex(i);
    onSelect(newValue, i);
  };

  return (
    <div data-prefix="Collateral:" className={styles.customSelect}>
      <select>
        {options.map((option, i) => (
          <CollateralOption key={option} collateral={option} onClick={() => setSelectValue(option, i)} />
        ))}
      </select>
    </div>
  );
};
